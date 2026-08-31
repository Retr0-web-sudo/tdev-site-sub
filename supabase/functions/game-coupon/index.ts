import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Server-side coupon issuance, validation, redemption.
// Uses service-role to bypass RLS (clients have no direct table access).

const DEFAULT_RULES: Record<string, { maxScore: number; discount: number }> = {
  memory: { maxScore: 12, discount: 20 },
  jigsaw: { maxScore: 20, discount: 15 },
  sliding: { maxScore: 40, discount: 10 },
  maze: { maxScore: 35, discount: 10 },
};

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "DRIP-";
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "validate") {
      const code = String(body.code || "").toUpperCase().trim();
      if (!code || code.length > 50) {
        return Response.json({ valid: false, discount: 0 }, { headers: corsHeaders });
      }
      const { data } = await supabase
        .from("discount_codes")
        .select("discount_percent, expires_at, used")
        .eq("code", code)
        .eq("used", false)
        .maybeSingle();
      if (!data) return Response.json({ valid: false, discount: 0 }, { headers: corsHeaders });
      if (new Date((data as any).expires_at) < new Date()) {
        return Response.json({ valid: false, discount: 0 }, { headers: corsHeaders });
      }
      return Response.json(
        { valid: true, discount: (data as any).discount_percent },
        { headers: corsHeaders },
      );
    }

    if (action === "redeem") {
      const code = String(body.code || "").toUpperCase().trim();
      const { error } = await supabase
        .from("discount_codes")
        .update({ used: true, used_at: new Date().toISOString() } as any)
        .eq("code", code)
        .eq("used", false);
      return Response.json({ ok: !error }, { headers: corsHeaders });
    }

    if (action === "award") {
      const game = String(body.game || "");
      const score = Number(body.score);
      if (!game || !Number.isFinite(score)) {
        return Response.json({ error: "Invalid input" }, { status: 400, headers: corsHeaders });
      }

      // Load rules from site_settings, fall back to defaults
      let rules = DEFAULT_RULES;
      const { data: settings } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "game_settings")
        .maybeSingle();
      if (settings && (settings as any).value?.rules) {
        rules = (settings as any).value.rules;
      }

      const rule = rules[game];
      if (!rule || score > rule.maxScore) {
        return Response.json({ awarded: false }, { headers: corsHeaders });
      }

      const code = genCode();
      const { error } = await supabase.from("discount_codes").insert({
        code,
        discount_percent: rule.discount,
        game_name: game,
      } as any);
      if (error) {
        return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
      }
      return Response.json(
        { awarded: true, code, discount: rule.discount },
        { headers: corsHeaders },
      );
    }

    return Response.json({ error: "Unknown action" }, { status: 400, headers: corsHeaders });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500, headers: corsHeaders },
    );
  }
});
