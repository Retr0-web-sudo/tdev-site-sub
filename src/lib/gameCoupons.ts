import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// All coupon logic is now server-side via the `game-coupon` edge function.
// The client no longer has direct read/write access to the discount_codes table.

export const getGameImages = async (): Promise<{ memoryImages: string[]; jigsawImages: string[] }> => {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "game_settings")
      .single();
    if (data?.value) {
      const v = data.value as any;
      return {
        memoryImages: v.memoryImages || [],
        jigsawImages: v.jigsawImages || [],
      };
    }
  } catch {}
  return { memoryImages: [], jigsawImages: [] };
};

export const checkAndAwardCoupon = async (
  game: string,
  score: number
): Promise<{ code: string; discount: number } | null> => {
  try {
    const { data, error } = await supabase.functions.invoke("game-coupon", {
      body: { action: "award", game, score },
    });
    if (error || !data?.awarded) return null;
    toast.success(`🎉 You earned a ${data.discount}% discount code!`, {
      description: `Code: ${data.code} — Valid for 7 days`,
      duration: 10000,
    });
    return { code: data.code, discount: data.discount };
  } catch {
    return null;
  }
};

export const validateCoupon = async (
  code: string
): Promise<{ valid: boolean; discount: number } | null> => {
  try {
    const { data, error } = await supabase.functions.invoke("game-coupon", {
      body: { action: "validate", code },
    });
    if (error) return { valid: false, discount: 0 };
    return { valid: !!data?.valid, discount: data?.discount ?? 0 };
  } catch {
    return null;
  }
};

export const redeemCoupon = async (code: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke("game-coupon", {
      body: { action: "redeem", code },
    });
    return !error && !!data?.ok;
  } catch {
    return false;
  }
};
