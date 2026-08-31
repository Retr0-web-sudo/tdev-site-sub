import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const ActionSchema = z.object({
  action: z.enum(["sync_products", "sync_orders", "sync_inventory"]),
  shop_id: z.string().optional(),
});

const PRINTIFY_BASE = "https://api.printify.com/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // --- AUTHN/AUTHZ: require admin JWT ------------------------------------
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: isAdmin } = await userClient.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Admin required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  // -----------------------------------------------------------------------

  const PRINTIFY_TOKEN = Deno.env.get("PRINTIFY_ACCESS_TOKEN");
  if (!PRINTIFY_TOKEN) {
    return new Response(JSON.stringify({ error: "Printify API key not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action } = parsed.data;

    const shopsRes = await fetch(`${PRINTIFY_BASE}/shops.json`, {
      headers: { Authorization: `Bearer ${PRINTIFY_TOKEN}` },
    });
    if (!shopsRes.ok) {
      throw new Error(`Printify shops fetch failed [${shopsRes.status}]`);
    }
    const shops = await shopsRes.json();
    const shopId = shops[0]?.id;
    if (!shopId) throw new Error("No Printify shop found");

    let message = "";

    if (action === "sync_products") {
      const res = await fetch(`${PRINTIFY_BASE}/shops/${shopId}/products.json`, {
        headers: { Authorization: `Bearer ${PRINTIFY_TOKEN}` },
      });
      if (!res.ok) throw new Error(`Printify products fetch failed [${res.status}]`);
      const { data: printifyProducts } = await res.json();

      let synced = 0;
      for (const pp of printifyProducts || []) {
        const slug = pp.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
        const images = (pp.images || []).map((img: any) => img.src).filter(Boolean);
        const price = pp.variants?.[0]?.price ? pp.variants[0].price / 100 : 0;

        await supabase.from("products").upsert(
          {
            name: pp.title,
            slug,
            description: pp.description || "",
            price,
            images,
            in_stock: pp.visible,
            shopify_product_id: pp.id,
          },
          { onConflict: "slug" }
        );
        synced++;
      }

      const { data: localProducts } = await supabase
        .from("products")
        .select("*")
        .is("shopify_product_id", null);

      let pushed = 0;
      for (const lp of localProducts || []) {
        const createRes = await fetch(`${PRINTIFY_BASE}/shops/${shopId}/products.json`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PRINTIFY_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: lp.name,
            description: lp.description || "",
            blueprint_id: 6,
            print_provider_id: 1,
            variants: [{ id: 1, price: Math.round(lp.price * 100), is_enabled: true }],
          }),
        });
        if (createRes.ok) {
          const created = await createRes.json();
          await supabase
            .from("products")
            .update({ shopify_product_id: created.id } as any)
            .eq("id", lp.id);
          pushed++;
        }
      }

      message = `Synced ${synced} products from Printify, pushed ${pushed} local products`;
    }

    if (action === "sync_orders") {
      const { data: pendingOrders } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "pending");

      let created = 0;
      for (const order of pendingOrders || []) {
        const items = (order.items as any[]) || [];
        const lineItems = items.map((item: any) => ({
          product_id: item.shopify_product_id || "",
          variant_id: 1,
          quantity: item.quantity || 1,
        }));

        const address = (order.shipping_address as any) || {};
        const res = await fetch(`${PRINTIFY_BASE}/shops/${shopId}/orders.json`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PRINTIFY_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            external_id: order.id,
            line_items: lineItems,
            shipping_method: 1,
            address_to: {
              first_name: address.firstName || "Customer",
              last_name: address.lastName || "",
              email: address.email || "",
              phone: address.phone || "",
              country: address.country || "US",
              region: address.state || "",
              address1: address.address || "",
              city: address.city || "",
              zip: address.zip || "",
            },
          }),
        });

        if (res.ok) {
          await supabase
            .from("orders")
            .update({ status: "processing" } as any)
            .eq("id", order.id);
          created++;
        }
      }
      message = `Pushed ${created} orders to Printify`;
    }

    if (action === "sync_inventory") {
      const res = await fetch(`${PRINTIFY_BASE}/shops/${shopId}/products.json`, {
        headers: { Authorization: `Bearer ${PRINTIFY_TOKEN}` },
      });
      if (!res.ok) throw new Error(`Printify products fetch failed [${res.status}]`);
      const { data: printifyProducts } = await res.json();

      let updated = 0;
      for (const pp of printifyProducts || []) {
        const slug = pp.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
        const isAvailable = pp.variants?.some((v: any) => v.is_available) ?? false;

        await supabase
          .from("products")
          .update({ in_stock: isAvailable } as any)
          .eq("slug", slug);
        updated++;
      }
      message = `Updated inventory for ${updated} products`;
    }

    return new Response(JSON.stringify({ success: true, message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Printify sync error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
