import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SHOPIFY_ACCESS_TOKEN = Deno.env.get("SHOPIFY_ACCESS_TOKEN")!;
const SHOPIFY_STORE_DOMAIN = "tdev-site-nq2zk.myshopify.com";
const SHOPIFY_ADMIN_URL = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2025-01`;

interface SyncRequest {
  product_ids?: string[]; // specific IDs, or omit for all unsynced
}

interface DBProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  in_stock: boolean | null;
  images: string[] | null;
  sizes: string[] | null;
  colors: string[] | null;
  shopify_product_id: number | null;
  shopify_synced_at: string | null;
}

interface CategoryRow {
  id: string;
  name: string;
}

async function shopifyAdmin(path: string, method: string, body?: unknown) {
  const res = await fetch(`${SHOPIFY_ADMIN_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify ${method} ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

function buildShopifyPayload(product: DBProduct, categoryName: string | null) {
  const tags: string[] = [];
  if (categoryName) tags.push(categoryName.toLowerCase());

  // Build variants from sizes × colors, or a single default variant
  const sizes = product.sizes?.length ? product.sizes : [null];
  const colors = product.colors?.length ? product.colors : [null];

  const hasOptions = (product.sizes?.length ?? 0) > 0 || (product.colors?.length ?? 0) > 0;

  const variants: Array<Record<string, unknown>> = [];
  for (const size of sizes) {
    for (const color of colors) {
      const v: Record<string, unknown> = {
        price: product.price.toString(),
        inventory_management: null, // no tracking
      };
      if (product.compare_at_price) v.compare_at_price = product.compare_at_price.toString();
      if (size) v.option1 = size;
      if (color) v.option2 = size ? color : undefined;
      // if only color, put it in option1
      if (!size && color) v.option1 = color;
      variants.push(v);
    }
  }

  const options: Array<{ name: string; values: string[] }> = [];
  if (product.sizes?.length) options.push({ name: "Size", values: product.sizes });
  if (product.colors?.length) options.push({ name: "Color", values: product.colors });

  const payload: Record<string, unknown> = {
    title: product.name,
    body_html: product.description || "",
    vendor: "TDEV",
    product_type: categoryName || "General",
    tags: tags.join(", "),
    status: product.in_stock === false ? "draft" : "active",
    variants,
  };

  if (hasOptions) {
    payload.options = options;
  }

  // Attach images if available
  if (product.images?.length) {
    payload.images = product.images.map((src: string) => ({ src }));
  }

  return payload;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: hasAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!hasAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: SyncRequest = req.method === "POST" ? await req.json() : {};

    // Fetch categories for mapping
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name");
    const catMap = new Map<string, string>();
    (categories || []).forEach((c: CategoryRow) => catMap.set(c.id, c.name));

    // Fetch products to sync
    let query = supabase.from("products").select("*");
    if (body.product_ids?.length) {
      query = query.in("id", body.product_ids);
    } else {
      // All unsynced products
      query = query.is("shopify_product_id", null);
    }

    const { data: products, error: prodErr } = await query;
    if (prodErr) throw prodErr;

    const results: Array<{ id: string; name: string; shopify_id: number | null; error?: string }> = [];

    for (const product of (products || []) as DBProduct[]) {
      try {
        const categoryName = product.category_id ? catMap.get(product.category_id) || null : null;
        const payload = buildShopifyPayload(product, categoryName);

        let shopifyProductId: number;

        if (product.shopify_product_id) {
          // Update existing
          await shopifyAdmin(`/products/${product.shopify_product_id}.json`, "PUT", { product: payload });
          shopifyProductId = product.shopify_product_id;
        } else {
          // Create new
          const res = await shopifyAdmin("/products.json", "POST", { product: payload });
          shopifyProductId = res.product.id;
        }

        // Update DB with Shopify ID
        await supabase
          .from("products")
          .update({
            shopify_product_id: shopifyProductId,
            shopify_synced_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        results.push({ id: product.id, name: product.name, shopify_id: shopifyProductId });
      } catch (err) {
        results.push({ id: product.id, name: product.name, shopify_id: null, error: String(err) });
      }
    }

    const synced = results.filter((r) => r.shopify_id);
    const failed = results.filter((r) => !r.shopify_id);

    return new Response(
      JSON.stringify({
        total: results.length,
        synced: synced.length,
        failed: failed.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
