import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ── Theme preset type ── */
export interface ThemePreset {
  id: string;
  name: string;
  mode: "light" | "dark";
  category: "core" | "neon" | "holiday";
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
  };
}

export const themePresets: ThemePreset[] = [
  // ── Core Themes ──
  {
    id: "warm-sand", name: "Warm Sand", mode: "light", category: "core",
    colors: {
      background: "35 30% 96%", foreground: "30 10% 12%", card: "35 25% 93%", cardForeground: "30 10% 12%",
      primary: "30 10% 12%", primaryForeground: "35 30% 96%", secondary: "33 20% 88%", secondaryForeground: "30 10% 12%",
      muted: "33 15% 90%", mutedForeground: "30 8% 45%", accent: "28 40% 50%", accentForeground: "35 30% 96%", border: "33 15% 85%",
    },
  },
  {
    id: "midnight-noir", name: "Midnight Noir", mode: "dark", category: "core",
    colors: {
      background: "0 0% 5%", foreground: "0 0% 95%", card: "0 0% 9%", cardForeground: "0 0% 95%",
      primary: "0 0% 95%", primaryForeground: "0 0% 5%", secondary: "0 0% 14%", secondaryForeground: "0 0% 95%",
      muted: "0 0% 14%", mutedForeground: "0 0% 55%", accent: "0 0% 40%", accentForeground: "0 0% 95%", border: "0 0% 16%",
    },
  },
  {
    id: "ocean-breeze", name: "Ocean Breeze", mode: "light", category: "core",
    colors: {
      background: "200 30% 97%", foreground: "210 25% 12%", card: "200 25% 94%", cardForeground: "210 25% 12%",
      primary: "210 25% 12%", primaryForeground: "200 30% 97%", secondary: "200 20% 89%", secondaryForeground: "210 25% 12%",
      muted: "200 15% 91%", mutedForeground: "210 10% 45%", accent: "195 60% 42%", accentForeground: "200 30% 97%", border: "200 15% 86%",
    },
  },
  {
    id: "forest-dusk", name: "Forest Dusk", mode: "dark", category: "core",
    colors: {
      background: "150 15% 7%", foreground: "140 15% 90%", card: "150 12% 11%", cardForeground: "140 15% 90%",
      primary: "140 15% 90%", primaryForeground: "150 15% 7%", secondary: "150 10% 16%", secondaryForeground: "140 15% 90%",
      muted: "150 10% 16%", mutedForeground: "140 8% 50%", accent: "145 35% 40%", accentForeground: "140 15% 95%", border: "150 10% 18%",
    },
  },
  {
    id: "blush-rose", name: "Blush Rosé", mode: "light", category: "core",
    colors: {
      background: "350 30% 97%", foreground: "340 15% 15%", card: "350 25% 94%", cardForeground: "340 15% 15%",
      primary: "340 15% 15%", primaryForeground: "350 30% 97%", secondary: "350 20% 90%", secondaryForeground: "340 15% 15%",
      muted: "350 15% 92%", mutedForeground: "340 8% 48%", accent: "345 45% 55%", accentForeground: "350 30% 97%", border: "350 15% 87%",
    },
  },
  {
    id: "terracotta", name: "Terracotta", mode: "light", category: "core",
    colors: {
      background: "25 35% 95%", foreground: "15 20% 14%", card: "25 30% 91%", cardForeground: "15 20% 14%",
      primary: "15 20% 14%", primaryForeground: "25 35% 95%", secondary: "22 25% 86%", secondaryForeground: "15 20% 14%",
      muted: "22 20% 88%", mutedForeground: "15 10% 45%", accent: "16 55% 48%", accentForeground: "25 35% 96%", border: "22 18% 82%",
    },
  },
  {
    id: "lavender-mist", name: "Lavender Mist", mode: "light", category: "core",
    colors: {
      background: "270 25% 97%", foreground: "265 15% 14%", card: "270 20% 94%", cardForeground: "265 15% 14%",
      primary: "265 15% 14%", primaryForeground: "270 25% 97%", secondary: "268 18% 90%", secondaryForeground: "265 15% 14%",
      muted: "268 14% 92%", mutedForeground: "265 8% 48%", accent: "265 40% 55%", accentForeground: "270 25% 97%", border: "268 14% 86%",
    },
  },
  // ── Cyber / Synthwave Themes ──
  {
    id: "synthwave-sunset", name: "Synthwave Sunset", mode: "dark", category: "core",
    colors: {
      background: "270 20% 4%", foreground: "320 80% 72%", card: "270 18% 8%", cardForeground: "310 30% 85%",
      primary: "320 80% 72%", primaryForeground: "270 20% 4%", secondary: "270 15% 12%", secondaryForeground: "310 30% 85%",
      muted: "270 12% 12%", mutedForeground: "300 15% 50%", accent: "290 70% 60%", accentForeground: "270 20% 4%", border: "280 20% 16%",
    },
  },
  {
    id: "cyberpunk-grid", name: "Cyberpunk Grid", mode: "dark", category: "core",
    colors: {
      background: "230 25% 4%", foreground: "185 90% 55%", card: "230 22% 8%", cardForeground: "180 30% 82%",
      primary: "185 90% 55%", primaryForeground: "230 25% 4%", secondary: "230 18% 12%", secondaryForeground: "180 30% 82%",
      muted: "230 15% 12%", mutedForeground: "200 15% 48%", accent: "330 85% 58%", accentForeground: "230 25% 4%", border: "220 18% 16%",
    },
  },
  {
    id: "retro-terminal", name: "Retro Terminal", mode: "dark", category: "core",
    colors: {
      background: "120 15% 3%", foreground: "120 80% 52%", card: "120 12% 6%", cardForeground: "120 40% 75%",
      primary: "120 80% 52%", primaryForeground: "120 15% 3%", secondary: "120 10% 10%", secondaryForeground: "120 40% 75%",
      muted: "120 8% 10%", mutedForeground: "120 15% 38%", accent: "120 70% 45%", accentForeground: "120 15% 3%", border: "120 12% 14%",
    },
  },
  {
    id: "neon-outrun", name: "Neon Outrun", mode: "dark", category: "core",
    colors: {
      background: "250 22% 5%", foreground: "45 95% 65%", card: "250 18% 9%", cardForeground: "40 40% 82%",
      primary: "45 95% 65%", primaryForeground: "250 22% 5%", secondary: "250 15% 13%", secondaryForeground: "40 40% 82%",
      muted: "250 12% 13%", mutedForeground: "260 12% 48%", accent: "320 80% 55%", accentForeground: "250 22% 5%", border: "255 15% 16%",
    },
  },

  // ── Gold Themes ──
  {
    id: "black-gold", name: "Black & Gold", mode: "dark", category: "core",
    colors: {
      background: "0 0% 4%", foreground: "43 80% 60%", card: "0 0% 8%", cardForeground: "43 40% 85%",
      primary: "43 80% 60%", primaryForeground: "0 0% 4%", secondary: "0 0% 12%", secondaryForeground: "43 40% 85%",
      muted: "0 0% 12%", mutedForeground: "43 15% 45%", accent: "43 90% 50%", accentForeground: "0 0% 4%", border: "43 20% 16%",
    },
  },
  {
    id: "white-gold", name: "White & Gold", mode: "light", category: "core",
    colors: {
      background: "0 0% 99%", foreground: "0 0% 10%", card: "40 20% 96%", cardForeground: "0 0% 10%",
      primary: "0 0% 10%", primaryForeground: "0 0% 99%", secondary: "40 15% 93%", secondaryForeground: "0 0% 10%",
      muted: "40 10% 94%", mutedForeground: "0 0% 45%", accent: "43 85% 48%", accentForeground: "0 0% 99%", border: "40 12% 88%",
    },
  },

  // ── Neon Themes (mixable) ──
  {
    id: "neon-mint", name: "Neon Mint", mode: "dark", category: "neon",
    colors: {
      background: "180 10% 6%", foreground: "165 70% 42%", card: "180 10% 10%", cardForeground: "160 20% 80%",
      primary: "165 70% 42%", primaryForeground: "180 10% 6%", secondary: "180 10% 14%", secondaryForeground: "160 20% 80%",
      muted: "180 8% 14%", mutedForeground: "165 15% 45%", accent: "165 70% 42%", accentForeground: "180 10% 6%", border: "165 25% 18%",
    },
  },
  {
    id: "neon-cyber", name: "Neon Cyber", mode: "dark", category: "neon",
    colors: {
      background: "260 15% 6%", foreground: "280 60% 58%", card: "260 15% 10%", cardForeground: "270 20% 80%",
      primary: "280 60% 58%", primaryForeground: "260 15% 6%", secondary: "260 12% 14%", secondaryForeground: "270 20% 80%",
      muted: "260 10% 14%", mutedForeground: "275 15% 45%", accent: "280 60% 52%", accentForeground: "260 15% 96%", border: "280 25% 20%",
    },
  },
  {
    id: "neon-sunset", name: "Neon Sunset", mode: "dark", category: "neon",
    colors: {
      background: "15 15% 6%", foreground: "25 70% 50%", card: "15 15% 10%", cardForeground: "30 25% 80%",
      primary: "25 70% 50%", primaryForeground: "15 15% 6%", secondary: "15 12% 14%", secondaryForeground: "30 25% 80%",
      muted: "15 10% 14%", mutedForeground: "20 15% 45%", accent: "340 65% 50%", accentForeground: "15 15% 96%", border: "25 25% 18%",
    },
  },
  {
    id: "neon-arctic", name: "Neon Arctic", mode: "dark", category: "neon",
    colors: {
      background: "210 15% 6%", foreground: "195 65% 48%", card: "210 15% 10%", cardForeground: "200 20% 80%",
      primary: "195 65% 48%", primaryForeground: "210 15% 6%", secondary: "210 12% 14%", secondaryForeground: "200 20% 80%",
      muted: "210 10% 14%", mutedForeground: "195 15% 45%", accent: "195 65% 45%", accentForeground: "210 15% 96%", border: "195 25% 18%",
    },
  },
  {
    id: "neon-rose", name: "Neon Rose", mode: "dark", category: "neon",
    colors: {
      background: "340 15% 6%", foreground: "330 55% 52%", card: "340 15% 10%", cardForeground: "335 20% 80%",
      primary: "330 55% 52%", primaryForeground: "340 15% 6%", secondary: "340 12% 14%", secondaryForeground: "335 20% 80%",
      muted: "340 10% 14%", mutedForeground: "330 15% 45%", accent: "330 55% 48%", accentForeground: "340 15% 96%", border: "330 25% 18%",
    },
  },
  {
    id: "neon-gold", name: "Neon Gold", mode: "dark", category: "neon",
    colors: {
      background: "40 15% 6%", foreground: "45 65% 45%", card: "40 15% 10%", cardForeground: "42 20% 80%",
      primary: "45 65% 45%", primaryForeground: "40 15% 6%", secondary: "40 12% 14%", secondaryForeground: "42 20% 80%",
      muted: "40 10% 14%", mutedForeground: "45 15% 45%", accent: "45 65% 42%", accentForeground: "40 15% 96%", border: "45 25% 18%",
    },
  },
  // ── Deeper Neon Variants ──
  {
    id: "neon-emerald", name: "Neon Emerald", mode: "dark", category: "neon",
    colors: {
      background: "160 12% 5%", foreground: "155 50% 38%", card: "160 10% 9%", cardForeground: "155 15% 75%",
      primary: "155 50% 38%", primaryForeground: "160 12% 5%", secondary: "160 10% 13%", secondaryForeground: "155 15% 75%",
      muted: "160 8% 13%", mutedForeground: "155 12% 42%", accent: "155 50% 35%", accentForeground: "160 12% 95%", border: "155 20% 16%",
    },
  },
  {
    id: "neon-plum", name: "Neon Plum", mode: "dark", category: "neon",
    colors: {
      background: "290 12% 5%", foreground: "285 45% 48%", card: "290 10% 9%", cardForeground: "285 15% 75%",
      primary: "285 45% 48%", primaryForeground: "290 12% 5%", secondary: "290 10% 13%", secondaryForeground: "285 15% 75%",
      muted: "290 8% 13%", mutedForeground: "285 12% 42%", accent: "285 45% 44%", accentForeground: "290 12% 95%", border: "285 20% 16%",
    },
  },
  {
    id: "neon-crimson", name: "Neon Crimson", mode: "dark", category: "neon",
    colors: {
      background: "350 12% 5%", foreground: "355 50% 45%", card: "350 10% 9%", cardForeground: "355 15% 75%",
      primary: "355 50% 45%", primaryForeground: "350 12% 5%", secondary: "350 10% 13%", secondaryForeground: "355 15% 75%",
      muted: "350 8% 13%", mutedForeground: "355 12% 42%", accent: "355 50% 42%", accentForeground: "350 12% 95%", border: "355 20% 16%",
    },
  },
  {
    id: "neon-amber", name: "Neon Amber", mode: "dark", category: "neon",
    colors: {
      background: "35 12% 5%", foreground: "38 55% 42%", card: "35 10% 9%", cardForeground: "38 18% 75%",
      primary: "38 55% 42%", primaryForeground: "35 12% 5%", secondary: "35 10% 13%", secondaryForeground: "38 18% 75%",
      muted: "35 8% 13%", mutedForeground: "38 12% 42%", accent: "38 55% 38%", accentForeground: "35 12% 95%", border: "38 20% 16%",
    },
  },
  {
    id: "neon-teal", name: "Neon Teal", mode: "dark", category: "neon",
    colors: {
      background: "190 12% 5%", foreground: "185 50% 38%", card: "190 10% 9%", cardForeground: "185 15% 75%",
      primary: "185 50% 38%", primaryForeground: "190 12% 5%", secondary: "190 10% 13%", secondaryForeground: "185 15% 75%",
      muted: "190 8% 13%", mutedForeground: "185 12% 42%", accent: "185 50% 35%", accentForeground: "190 12% 95%", border: "185 20% 16%",
    },
  },
  {
    id: "neon-indigo", name: "Neon Indigo", mode: "dark", category: "neon",
    colors: {
      background: "235 12% 5%", foreground: "230 45% 50%", card: "235 10% 9%", cardForeground: "230 15% 75%",
      primary: "230 45% 50%", primaryForeground: "235 12% 5%", secondary: "235 10% 13%", secondaryForeground: "230 15% 75%",
      muted: "235 8% 13%", mutedForeground: "230 12% 42%", accent: "230 45% 46%", accentForeground: "235 12% 95%", border: "230 20% 16%",
    },
  },
  // ── Multi-Color Neon Mixes (darker shades) ──
  {
    id: "neon-voidbloom", name: "Neon Voidbloom", mode: "dark", category: "neon",
    colors: {
      background: "280 14% 4%", foreground: "310 55% 52%", card: "280 12% 8%", cardForeground: "320 18% 78%",
      primary: "310 55% 52%", primaryForeground: "280 14% 4%", secondary: "280 10% 12%", secondaryForeground: "320 18% 78%",
      muted: "280 8% 12%", mutedForeground: "300 14% 40%", accent: "265 50% 48%", accentForeground: "280 14% 95%", border: "295 22% 15%",
    },
  },
  {
    id: "neon-toxic", name: "Neon Toxic", mode: "dark", category: "neon",
    colors: {
      background: "100 12% 4%", foreground: "90 65% 38%", card: "100 10% 7%", cardForeground: "95 18% 72%",
      primary: "90 65% 38%", primaryForeground: "100 12% 4%", secondary: "100 10% 11%", secondaryForeground: "95 18% 72%",
      muted: "100 8% 11%", mutedForeground: "95 14% 36%", accent: "60 55% 40%", accentForeground: "100 12% 95%", border: "85 22% 14%",
    },
  },
  {
    id: "neon-bloodmoon", name: "Neon Bloodmoon", mode: "dark", category: "neon",
    colors: {
      background: "0 14% 4%", foreground: "355 55% 42%", card: "0 12% 7%", cardForeground: "5 18% 74%",
      primary: "355 55% 42%", primaryForeground: "0 14% 4%", secondary: "0 10% 11%", secondaryForeground: "5 18% 74%",
      muted: "0 8% 11%", mutedForeground: "358 14% 38%", accent: "25 60% 40%", accentForeground: "0 14% 95%", border: "352 22% 14%",
    },
  },
  {
    id: "neon-aurora", name: "Neon Aurora", mode: "dark", category: "neon",
    colors: {
      background: "220 14% 4%", foreground: "170 55% 40%", card: "220 12% 7%", cardForeground: "180 18% 74%",
      primary: "170 55% 40%", primaryForeground: "220 14% 4%", secondary: "220 10% 11%", secondaryForeground: "180 18% 74%",
      muted: "220 8% 11%", mutedForeground: "195 14% 38%", accent: "280 50% 50%", accentForeground: "220 14% 95%", border: "200 22% 14%",
    },
  },
  {
    id: "neon-synth", name: "Neon Synthwave", mode: "dark", category: "neon",
    colors: {
      background: "260 16% 4%", foreground: "320 60% 50%", card: "260 14% 7%", cardForeground: "310 20% 78%",
      primary: "320 60% 50%", primaryForeground: "260 16% 4%", secondary: "260 12% 11%", secondaryForeground: "310 20% 78%",
      muted: "260 8% 11%", mutedForeground: "300 14% 40%", accent: "195 65% 42%", accentForeground: "260 16% 95%", border: "290 22% 15%",
    },
  },
  {
    id: "neon-infrared", name: "Neon Infrared", mode: "dark", category: "neon",
    colors: {
      background: "340 14% 4%", foreground: "350 60% 45%", card: "340 12% 7%", cardForeground: "345 18% 76%",
      primary: "350 60% 45%", primaryForeground: "340 14% 4%", secondary: "340 10% 11%", secondaryForeground: "345 18% 76%",
      muted: "340 8% 11%", mutedForeground: "348 14% 38%", accent: "30 55% 42%", accentForeground: "340 14% 95%", border: "345 22% 14%",
    },
  },
  {
    id: "neon-phantom", name: "Neon Phantom", mode: "dark", category: "neon",
    colors: {
      background: "240 10% 3%", foreground: "220 40% 48%", card: "240 8% 6%", cardForeground: "225 14% 72%",
      primary: "220 40% 48%", primaryForeground: "240 10% 3%", secondary: "240 8% 10%", secondaryForeground: "225 14% 72%",
      muted: "240 6% 10%", mutedForeground: "225 10% 38%", accent: "270 45% 45%", accentForeground: "240 10% 95%", border: "235 18% 13%",
    },
  },
  {
    id: "neon-solar", name: "Neon Solar Flare", mode: "dark", category: "neon",
    colors: {
      background: "20 14% 4%", foreground: "35 65% 42%", card: "20 12% 7%", cardForeground: "30 20% 76%",
      primary: "35 65% 42%", primaryForeground: "20 14% 4%", secondary: "20 10% 11%", secondaryForeground: "30 20% 76%",
      muted: "20 8% 11%", mutedForeground: "28 14% 38%", accent: "5 55% 45%", accentForeground: "20 14% 95%", border: "30 22% 14%",
    },
  },
  // ── Classic Neon Overlays ──
  {
    id: "neon-electric-blue", name: "Neon Electric Blue", mode: "dark", category: "neon",
    colors: {
      background: "220 15% 5%", foreground: "210 80% 55%", card: "220 12% 8%", cardForeground: "215 20% 80%",
      primary: "210 80% 55%", primaryForeground: "220 15% 5%", secondary: "220 10% 12%", secondaryForeground: "215 20% 80%",
      muted: "220 8% 12%", mutedForeground: "210 15% 42%", accent: "210 80% 50%", accentForeground: "220 15% 95%", border: "210 25% 16%",
    },
  },
  {
    id: "neon-hot-pink", name: "Neon Hot Pink", mode: "dark", category: "neon",
    colors: {
      background: "320 14% 4%", foreground: "330 80% 55%", card: "320 12% 7%", cardForeground: "325 22% 80%",
      primary: "330 80% 55%", primaryForeground: "320 14% 4%", secondary: "320 10% 11%", secondaryForeground: "325 22% 80%",
      muted: "320 8% 11%", mutedForeground: "328 14% 40%", accent: "330 80% 50%", accentForeground: "320 14% 95%", border: "328 22% 15%",
    },
  },
  {
    id: "neon-lime", name: "Neon Lime", mode: "dark", category: "neon",
    colors: {
      background: "80 12% 4%", foreground: "85 75% 42%", card: "80 10% 7%", cardForeground: "82 18% 74%",
      primary: "85 75% 42%", primaryForeground: "80 12% 4%", secondary: "80 10% 11%", secondaryForeground: "82 18% 74%",
      muted: "80 8% 11%", mutedForeground: "83 14% 36%", accent: "85 75% 38%", accentForeground: "80 12% 95%", border: "83 22% 14%",
    },
  },
  {
    id: "neon-violet", name: "Neon Violet", mode: "dark", category: "neon",
    colors: {
      background: "270 14% 4%", foreground: "275 65% 55%", card: "270 12% 7%", cardForeground: "272 18% 78%",
      primary: "275 65% 55%", primaryForeground: "270 14% 4%", secondary: "270 10% 11%", secondaryForeground: "272 18% 78%",
      muted: "270 8% 11%", mutedForeground: "273 14% 40%", accent: "275 65% 50%", accentForeground: "270 14% 95%", border: "273 22% 15%",
    },
  },
  {
    id: "neon-magenta", name: "Neon Magenta", mode: "dark", category: "neon",
    colors: {
      background: "300 14% 4%", foreground: "305 60% 52%", card: "300 12% 7%", cardForeground: "302 18% 76%",
      primary: "305 60% 52%", primaryForeground: "300 14% 4%", secondary: "300 10% 11%", secondaryForeground: "302 18% 76%",
      muted: "300 8% 11%", mutedForeground: "303 14% 38%", accent: "305 60% 48%", accentForeground: "300 14% 95%", border: "303 22% 14%",
    },
  },
  {
    id: "neon-coral", name: "Neon Coral", mode: "dark", category: "neon",
    colors: {
      background: "10 14% 4%", foreground: "12 70% 50%", card: "10 12% 7%", cardForeground: "11 20% 76%",
      primary: "12 70% 50%", primaryForeground: "10 14% 4%", secondary: "10 10% 11%", secondaryForeground: "11 20% 76%",
      muted: "10 8% 11%", mutedForeground: "11 14% 38%", accent: "12 70% 46%", accentForeground: "10 14% 95%", border: "11 22% 14%",
    },
  },
  // ── Dual-Tone Neon Mixes ──
  {
    id: "neon-cyberpunk", name: "Neon Cyberpunk", mode: "dark", category: "neon",
    colors: {
      background: "250 16% 3%", foreground: "55 85% 52%", card: "250 14% 6%", cardForeground: "50 22% 78%",
      primary: "55 85% 52%", primaryForeground: "250 16% 3%", secondary: "250 12% 10%", secondaryForeground: "50 22% 78%",
      muted: "250 8% 10%", mutedForeground: "52 14% 40%", accent: "320 70% 50%", accentForeground: "250 16% 95%", border: "280 22% 14%",
    },
  },
  {
    id: "neon-matrix", name: "Neon Matrix", mode: "dark", category: "neon",
    colors: {
      background: "130 14% 3%", foreground: "120 80% 42%", card: "130 12% 6%", cardForeground: "125 18% 72%",
      primary: "120 80% 42%", primaryForeground: "130 14% 3%", secondary: "130 10% 10%", secondaryForeground: "125 18% 72%",
      muted: "130 8% 10%", mutedForeground: "125 14% 36%", accent: "120 80% 38%", accentForeground: "130 14% 95%", border: "125 22% 13%",
    },
  },
  {
    id: "neon-ice-fire", name: "Neon Ice & Fire", mode: "dark", category: "neon",
    colors: {
      background: "210 14% 4%", foreground: "200 70% 48%", card: "210 12% 7%", cardForeground: "205 18% 76%",
      primary: "200 70% 48%", primaryForeground: "210 14% 4%", secondary: "210 10% 11%", secondaryForeground: "205 18% 76%",
      muted: "210 8% 11%", mutedForeground: "205 14% 38%", accent: "15 65% 48%", accentForeground: "210 14% 95%", border: "205 22% 14%",
    },
  },
  {
    id: "neon-twilight", name: "Neon Twilight", mode: "dark", category: "neon",
    colors: {
      background: "250 12% 4%", foreground: "260 50% 55%", card: "250 10% 7%", cardForeground: "255 16% 76%",
      primary: "260 50% 55%", primaryForeground: "250 12% 4%", secondary: "250 8% 11%", secondaryForeground: "255 16% 76%",
      muted: "250 6% 11%", mutedForeground: "257 12% 40%", accent: "200 55% 45%", accentForeground: "250 12% 95%", border: "255 18% 14%",
    },
  },
  {
    id: "neon-poison", name: "Neon Poison", mode: "dark", category: "neon",
    colors: {
      background: "140 14% 3%", foreground: "145 60% 38%", card: "140 12% 6%", cardForeground: "142 16% 72%",
      primary: "145 60% 38%", primaryForeground: "140 14% 3%", secondary: "140 10% 10%", secondaryForeground: "142 16% 72%",
      muted: "140 8% 10%", mutedForeground: "143 12% 35%", accent: "300 50% 45%", accentForeground: "140 14% 95%", border: "142 20% 13%",
    },
  },
  {
    id: "neon-obsidian", name: "Neon Obsidian", mode: "dark", category: "neon",
    colors: {
      background: "0 0% 3%", foreground: "0 0% 60%", card: "0 0% 6%", cardForeground: "0 0% 70%",
      primary: "0 0% 60%", primaryForeground: "0 0% 3%", secondary: "0 0% 10%", secondaryForeground: "0 0% 70%",
      muted: "0 0% 10%", mutedForeground: "0 0% 38%", accent: "165 70% 42%", accentForeground: "0 0% 95%", border: "0 0% 14%",
    },
  },


  {
    id: "christmas", name: "🎄 Christmas", mode: "dark", category: "holiday",
    colors: {
      background: "0 20% 8%", foreground: "45 80% 90%", card: "0 18% 12%", cardForeground: "45 60% 88%",
      primary: "120 60% 35%", primaryForeground: "45 80% 95%", secondary: "0 65% 25%", secondaryForeground: "45 60% 90%",
      muted: "0 15% 15%", mutedForeground: "0 10% 50%", accent: "0 75% 50%", accentForeground: "45 80% 95%", border: "120 30% 18%",
    },
  },
  {
    id: "diwali", name: "🪔 Diwali", mode: "dark", category: "holiday",
    colors: {
      background: "20 25% 7%", foreground: "42 90% 65%", card: "20 20% 11%", cardForeground: "42 70% 80%",
      primary: "42 90% 55%", primaryForeground: "20 25% 7%", secondary: "15 50% 18%", secondaryForeground: "42 70% 80%",
      muted: "20 15% 14%", mutedForeground: "30 20% 45%", accent: "25 90% 55%", accentForeground: "20 25% 7%", border: "42 40% 22%",
    },
  },
  {
    id: "lunar-new-year", name: "🧧 Lunar New Year", mode: "dark", category: "holiday",
    colors: {
      background: "0 30% 8%", foreground: "45 100% 70%", card: "0 25% 12%", cardForeground: "45 80% 80%",
      primary: "0 80% 50%", primaryForeground: "45 100% 90%", secondary: "0 40% 18%", secondaryForeground: "45 80% 80%",
      muted: "0 20% 14%", mutedForeground: "0 10% 45%", accent: "45 100% 55%", accentForeground: "0 30% 8%", border: "0 50% 22%",
    },
  },
  {
    id: "halloween", name: "🎃 Halloween", mode: "dark", category: "holiday",
    colors: {
      background: "270 20% 6%", foreground: "30 100% 55%", card: "270 18% 10%", cardForeground: "30 60% 80%",
      primary: "30 100% 50%", primaryForeground: "270 20% 6%", secondary: "270 15% 15%", secondaryForeground: "30 60% 80%",
      muted: "270 12% 14%", mutedForeground: "270 10% 40%", accent: "120 80% 35%", accentForeground: "270 20% 6%", border: "30 40% 18%",
    },
  },
  {
    id: "eid", name: "🌙 Eid", mode: "dark", category: "holiday",
    colors: {
      background: "220 20% 8%", foreground: "45 70% 80%", card: "220 18% 12%", cardForeground: "45 50% 85%",
      primary: "160 50% 45%", primaryForeground: "45 70% 95%", secondary: "220 15% 16%", secondaryForeground: "45 50% 85%",
      muted: "220 12% 14%", mutedForeground: "220 10% 45%", accent: "45 80% 55%", accentForeground: "220 20% 8%", border: "160 25% 20%",
    },
  },
  {
    id: "sakura", name: "🌸 Sakura (Hanami)", mode: "light", category: "holiday",
    colors: {
      background: "340 40% 96%", foreground: "340 20% 18%", card: "340 35% 93%", cardForeground: "340 20% 18%",
      primary: "340 55% 60%", primaryForeground: "340 40% 97%", secondary: "340 30% 88%", secondaryForeground: "340 20% 18%",
      muted: "340 25% 91%", mutedForeground: "340 10% 48%", accent: "340 65% 55%", accentForeground: "340 40% 97%", border: "340 25% 85%",
    },
  },
  {
    id: "holi", name: "🎨 Holi", mode: "light", category: "holiday",
    colors: {
      background: "60 30% 97%", foreground: "280 30% 15%", card: "60 25% 94%", cardForeground: "280 30% 15%",
      primary: "280 70% 55%", primaryForeground: "60 30% 97%", secondary: "180 40% 88%", secondaryForeground: "280 30% 15%",
      muted: "45 20% 91%", mutedForeground: "280 10% 45%", accent: "45 90% 55%", accentForeground: "280 30% 15%", border: "180 25% 82%",
    },
  },
  {
    id: "carnival", name: "🎭 Carnival", mode: "dark", category: "holiday",
    colors: {
      background: "270 25% 7%", foreground: "50 100% 65%", card: "270 20% 11%", cardForeground: "50 60% 85%",
      primary: "280 80% 60%", primaryForeground: "50 100% 95%", secondary: "270 18% 16%", secondaryForeground: "50 60% 85%",
      muted: "270 14% 14%", mutedForeground: "270 10% 42%", accent: "120 80% 50%", accentForeground: "270 25% 7%", border: "280 35% 22%",
    },
  },
  {
    id: "valentines", name: "💕 Valentine's Day", mode: "light", category: "holiday",
    colors: {
      background: "350 45% 96%", foreground: "345 30% 18%", card: "350 40% 92%", cardForeground: "345 30% 18%",
      primary: "345 80% 55%", primaryForeground: "350 45% 97%", secondary: "350 35% 87%", secondaryForeground: "345 30% 18%",
      muted: "350 30% 90%", mutedForeground: "345 12% 48%", accent: "345 90% 60%", accentForeground: "350 45% 97%", border: "350 30% 84%",
    },
  },
  {
    id: "easter", name: "🐣 Easter", mode: "light", category: "holiday",
    colors: {
      background: "120 25% 96%", foreground: "270 20% 18%", card: "60 30% 93%", cardForeground: "270 20% 18%",
      primary: "280 50% 60%", primaryForeground: "120 25% 97%", secondary: "180 30% 88%", secondaryForeground: "270 20% 18%",
      muted: "60 20% 91%", mutedForeground: "270 10% 48%", accent: "45 80% 60%", accentForeground: "270 20% 18%", border: "180 20% 84%",
    },
  },
  {
    id: "independence-day", name: "🇺🇸 4th of July", mode: "dark", category: "holiday",
    colors: {
      background: "220 35% 8%", foreground: "0 0% 95%", card: "220 30% 12%", cardForeground: "0 0% 92%",
      primary: "0 80% 50%", primaryForeground: "0 0% 98%", secondary: "220 60% 30%", secondaryForeground: "0 0% 92%",
      muted: "220 20% 14%", mutedForeground: "220 10% 50%", accent: "0 0% 95%", accentForeground: "220 35% 8%", border: "220 40% 22%",
    },
  },
  {
    id: "thanksgiving", name: "🦃 Thanksgiving", mode: "light", category: "holiday",
    colors: {
      background: "30 35% 94%", foreground: "20 25% 14%", card: "35 30% 90%", cardForeground: "20 25% 14%",
      primary: "20 60% 40%", primaryForeground: "30 35% 96%", secondary: "40 30% 82%", secondaryForeground: "20 25% 14%",
      muted: "35 20% 87%", mutedForeground: "20 12% 42%", accent: "15 70% 45%", accentForeground: "30 35% 96%", border: "35 20% 78%",
    },
  },
  {
    id: "hanukkah", name: "🕎 Hanukkah", mode: "dark", category: "holiday",
    colors: {
      background: "220 25% 8%", foreground: "45 60% 85%", card: "220 22% 12%", cardForeground: "45 40% 85%",
      primary: "215 70% 55%", primaryForeground: "45 60% 95%", secondary: "220 18% 16%", secondaryForeground: "45 40% 85%",
      muted: "220 14% 14%", mutedForeground: "220 10% 45%", accent: "45 70% 55%", accentForeground: "220 25% 8%", border: "215 35% 22%",
    },
  },
  {
    id: "kwanzaa", name: "🕯️ Kwanzaa", mode: "dark", category: "holiday",
    colors: {
      background: "0 15% 7%", foreground: "120 60% 55%", card: "0 12% 11%", cardForeground: "45 50% 82%",
      primary: "0 70% 45%", primaryForeground: "45 70% 95%", secondary: "0 10% 15%", secondaryForeground: "45 50% 82%",
      muted: "0 8% 14%", mutedForeground: "0 8% 42%", accent: "120 70% 40%", accentForeground: "0 15% 7%", border: "0 30% 18%",
    },
  },
  {
    id: "day-of-dead", name: "💀 Día de Muertos", mode: "dark", category: "holiday",
    colors: {
      background: "280 20% 6%", foreground: "45 100% 60%", card: "280 18% 10%", cardForeground: "310 40% 85%",
      primary: "310 80% 55%", primaryForeground: "280 20% 6%", secondary: "280 15% 14%", secondaryForeground: "310 40% 85%",
      muted: "280 12% 14%", mutedForeground: "280 10% 40%", accent: "45 100% 55%", accentForeground: "280 20% 6%", border: "310 35% 20%",
    },
  },
  {
    id: "mid-autumn", name: "🥮 Mid-Autumn", mode: "dark", category: "holiday",
    colors: {
      background: "30 20% 7%", foreground: "42 80% 70%", card: "30 18% 11%", cardForeground: "42 50% 82%",
      primary: "42 75% 50%", primaryForeground: "30 20% 7%", secondary: "30 15% 15%", secondaryForeground: "42 50% 82%",
      muted: "30 12% 14%", mutedForeground: "30 10% 42%", accent: "15 60% 45%", accentForeground: "42 80% 95%", border: "42 30% 20%",
    },
  },
  {
    id: "pride", name: "🏳️‍🌈 Pride", mode: "light", category: "holiday",
    colors: {
      background: "0 0% 98%", foreground: "280 30% 15%", card: "0 0% 95%", cardForeground: "280 30% 15%",
      primary: "280 70% 55%", primaryForeground: "0 0% 98%", secondary: "195 60% 88%", secondaryForeground: "280 30% 15%",
      muted: "45 20% 92%", mutedForeground: "280 10% 45%", accent: "0 80% 55%", accentForeground: "0 0% 98%", border: "195 30% 82%",
    },
  },
  {
    id: "oktoberfest", name: "🍺 Oktoberfest", mode: "light", category: "holiday",
    colors: {
      background: "40 30% 95%", foreground: "215 30% 15%", card: "40 25% 91%", cardForeground: "215 30% 15%",
      primary: "215 60% 40%", primaryForeground: "40 30% 96%", secondary: "40 25% 85%", secondaryForeground: "215 30% 15%",
      muted: "40 18% 88%", mutedForeground: "215 12% 42%", accent: "30 70% 45%", accentForeground: "40 30% 96%", border: "40 18% 80%",
    },
  },
  {
    id: "mardi-gras", name: "⚜️ Mardi Gras", mode: "dark", category: "holiday",
    colors: {
      background: "270 22% 7%", foreground: "45 100% 60%", card: "270 18% 11%", cardForeground: "45 60% 82%",
      primary: "280 75% 55%", primaryForeground: "45 100% 95%", secondary: "270 15% 15%", secondaryForeground: "45 60% 82%",
      muted: "270 12% 14%", mutedForeground: "270 10% 42%", accent: "120 75% 40%", accentForeground: "270 22% 7%", border: "280 30% 20%",
    },
  },
  {
    id: "st-patricks", name: "☘️ St. Patrick's", mode: "dark", category: "holiday",
    colors: {
      background: "140 20% 7%", foreground: "120 70% 55%", card: "140 18% 11%", cardForeground: "120 30% 82%",
      primary: "120 65% 40%", primaryForeground: "140 20% 95%", secondary: "140 15% 15%", secondaryForeground: "120 30% 82%",
      muted: "140 12% 14%", mutedForeground: "140 10% 42%", accent: "42 80% 50%", accentForeground: "140 20% 7%", border: "120 30% 18%",
    },
  },
  {
    id: "new-years", name: "🎆 New Year's Eve", mode: "dark", category: "holiday",
    colors: {
      background: "240 15% 6%", foreground: "45 90% 75%", card: "240 12% 10%", cardForeground: "45 50% 85%",
      primary: "45 90% 55%", primaryForeground: "240 15% 6%", secondary: "240 10% 14%", secondaryForeground: "45 50% 85%",
      muted: "240 8% 14%", mutedForeground: "240 10% 45%", accent: "0 0% 85%", accentForeground: "240 15% 6%", border: "45 30% 18%",
    },
  },
  {
    id: "breast-cancer", name: "🎀 Breast Cancer Awareness", mode: "light", category: "holiday",
    colors: {
      background: "330 35% 96%", foreground: "330 20% 15%", card: "330 30% 93%", cardForeground: "330 20% 15%",
      primary: "330 70% 55%", primaryForeground: "330 35% 97%", secondary: "330 25% 88%", secondaryForeground: "330 20% 15%",
      muted: "330 20% 91%", mutedForeground: "330 10% 48%", accent: "330 80% 50%", accentForeground: "330 35% 97%", border: "330 22% 84%",
    },
  },
  {
    id: "mothers-day", name: "💐 Mother's Day", mode: "light", category: "holiday",
    colors: {
      background: "310 30% 96%", foreground: "310 18% 16%", card: "310 25% 93%", cardForeground: "310 18% 16%",
      primary: "310 50% 55%", primaryForeground: "310 30% 97%", secondary: "340 30% 88%", secondaryForeground: "310 18% 16%",
      muted: "310 20% 91%", mutedForeground: "310 10% 48%", accent: "340 60% 55%", accentForeground: "310 30% 97%", border: "310 20% 85%",
    },
  },
  {
    id: "fathers-day", name: "👔 Father's Day", mode: "dark", category: "holiday",
    colors: {
      background: "215 20% 8%", foreground: "210 15% 85%", card: "215 18% 12%", cardForeground: "210 12% 82%",
      primary: "210 50% 45%", primaryForeground: "210 15% 95%", secondary: "215 15% 16%", secondaryForeground: "210 12% 82%",
      muted: "215 12% 14%", mutedForeground: "215 8% 45%", accent: "35 50% 50%", accentForeground: "215 20% 8%", border: "210 25% 20%",
    },
  },
  {
    id: "juneteenth", name: "✊ Juneteenth", mode: "dark", category: "holiday",
    colors: {
      background: "120 15% 7%", foreground: "45 80% 70%", card: "120 12% 11%", cardForeground: "45 50% 82%",
      primary: "0 70% 48%", primaryForeground: "45 80% 95%", secondary: "120 10% 15%", secondaryForeground: "45 50% 82%",
      muted: "120 8% 14%", mutedForeground: "120 8% 42%", accent: "120 65% 35%", accentForeground: "45 80% 95%", border: "0 35% 20%",
    },
  },
  {
    id: "black-history", name: "✨ Black History Month", mode: "dark", category: "holiday",
    colors: {
      background: "30 15% 6%", foreground: "42 85% 65%", card: "30 12% 10%", cardForeground: "42 50% 80%",
      primary: "0 65% 45%", primaryForeground: "42 85% 95%", secondary: "30 10% 14%", secondaryForeground: "42 50% 80%",
      muted: "30 8% 14%", mutedForeground: "30 8% 42%", accent: "120 60% 38%", accentForeground: "30 15% 6%", border: "42 30% 18%",
    },
  },
  {
    id: "womens-day", name: "💜 Int'l Women's Day", mode: "light", category: "holiday",
    colors: {
      background: "280 30% 97%", foreground: "280 20% 14%", card: "280 25% 94%", cardForeground: "280 20% 14%",
      primary: "280 60% 50%", primaryForeground: "280 30% 97%", secondary: "280 22% 89%", secondaryForeground: "280 20% 14%",
      muted: "280 18% 91%", mutedForeground: "280 10% 45%", accent: "280 70% 55%", accentForeground: "280 30% 97%", border: "280 18% 84%",
    },
  },
  {
    id: "earth-day", name: "🌍 Earth Day", mode: "light", category: "holiday",
    colors: {
      background: "140 25% 96%", foreground: "150 20% 14%", card: "140 20% 93%", cardForeground: "150 20% 14%",
      primary: "150 55% 38%", primaryForeground: "140 25% 97%", secondary: "180 25% 87%", secondaryForeground: "150 20% 14%",
      muted: "140 18% 90%", mutedForeground: "150 10% 45%", accent: "195 55% 42%", accentForeground: "140 25% 97%", border: "140 18% 83%",
    },
  },
  {
    id: "mental-health", name: "🧠 Mental Health Awareness", mode: "light", category: "holiday",
    colors: {
      background: "145 28% 96%", foreground: "145 18% 15%", card: "145 22% 93%", cardForeground: "145 18% 15%",
      primary: "145 50% 42%", primaryForeground: "145 28% 97%", secondary: "145 20% 88%", secondaryForeground: "145 18% 15%",
      muted: "145 16% 90%", mutedForeground: "145 10% 45%", accent: "145 60% 38%", accentForeground: "145 28% 97%", border: "145 16% 84%",
    },
  },
];

/* helper lists */
export const neonPresets = themePresets.filter((p) => p.category === "neon");
export const basePresets = themePresets.filter((p) => p.category !== "neon");

/* ── Seasonal auto-detection ── */
interface SeasonalSuggestion {
  presetId: string;
  name: string;
  reason: string;
}

const seasonalMap: { presetId: string; name: string; ranges: [number, number, number, number][]; reason: string }[] = [
  { presetId: "new-years", name: "🎆 New Year's Eve", ranges: [[12, 28, 1, 3]], reason: "Happy New Year!" },
  { presetId: "black-history", name: "✨ Black History Month", ranges: [[2, 1, 2, 28]], reason: "Black History Month" },
  { presetId: "valentines", name: "💕 Valentine's Day", ranges: [[2, 7, 2, 15]], reason: "Valentine's Day is here" },
  { presetId: "mardi-gras", name: "⚜️ Mardi Gras", ranges: [[2, 13, 2, 25]], reason: "Mardi Gras season" },
  { presetId: "womens-day", name: "💜 Int'l Women's Day", ranges: [[3, 5, 3, 10]], reason: "International Women's Day" },
  { presetId: "st-patricks", name: "☘️ St. Patrick's", ranges: [[3, 14, 3, 18]], reason: "St. Patrick's Day" },
  { presetId: "holi", name: "🎨 Holi", ranges: [[3, 20, 3, 28]], reason: "Holi festival of colors" },
  { presetId: "sakura", name: "🌸 Sakura (Hanami)", ranges: [[3, 25, 4, 15]], reason: "Cherry blossom season" },
  { presetId: "easter", name: "🐣 Easter", ranges: [[3, 28, 4, 22]], reason: "Easter season" },
  { presetId: "earth-day", name: "🌍 Earth Day", ranges: [[4, 18, 4, 24]], reason: "Earth Day" },
  { presetId: "mothers-day", name: "💐 Mother's Day", ranges: [[5, 5, 5, 15]], reason: "Happy Mother's Day" },
  { presetId: "mental-health", name: "🧠 Mental Health Awareness", ranges: [[5, 1, 5, 31]], reason: "Mental Health Awareness Month" },
  { presetId: "pride", name: "🏳️‍🌈 Pride", ranges: [[6, 1, 6, 30]], reason: "Pride Month" },
  { presetId: "juneteenth", name: "✊ Juneteenth", ranges: [[6, 15, 6, 21]], reason: "Juneteenth" },
  { presetId: "fathers-day", name: "👔 Father's Day", ranges: [[6, 12, 6, 20]], reason: "Happy Father's Day" },
  { presetId: "independence-day", name: "🇺🇸 4th of July", ranges: [[6, 28, 7, 5]], reason: "Independence Day" },
  { presetId: "oktoberfest", name: "🍺 Oktoberfest", ranges: [[9, 16, 10, 6]], reason: "Oktoberfest season" },
  { presetId: "breast-cancer", name: "🎀 Breast Cancer Awareness", ranges: [[10, 1, 10, 31]], reason: "Breast Cancer Awareness Month" },
  { presetId: "halloween", name: "🎃 Halloween", ranges: [[10, 15, 10, 31]], reason: "Spooky season" },
  { presetId: "day-of-dead", name: "💀 Día de Muertos", ranges: [[10, 31, 11, 2]], reason: "Día de Muertos" },
  { presetId: "diwali", name: "🪔 Diwali", ranges: [[10, 20, 11, 15]], reason: "Diwali festival of lights" },
  { presetId: "thanksgiving", name: "🦃 Thanksgiving", ranges: [[11, 18, 11, 28]], reason: "Happy Thanksgiving" },
  { presetId: "hanukkah", name: "🕎 Hanukkah", ranges: [[11, 25, 12, 30]], reason: "Happy Hanukkah" },
  { presetId: "kwanzaa", name: "🕯️ Kwanzaa", ranges: [[12, 26, 1, 1]], reason: "Happy Kwanzaa" },
  { presetId: "christmas", name: "🎄 Christmas", ranges: [[12, 1, 12, 26]], reason: "Holiday season" },
  { presetId: "mid-autumn", name: "🥮 Mid-Autumn", ranges: [[9, 10, 9, 30]], reason: "Mid-Autumn Festival" },
  { presetId: "carnival", name: "🎭 Carnival", ranges: [[2, 1, 2, 20]], reason: "Carnival season" },
  { presetId: "lunar-new-year", name: "🧧 Lunar New Year", ranges: [[1, 20, 2, 10]], reason: "Lunar New Year" },
];

function isDateInRange(month: number, day: number, sm: number, sd: number, em: number, ed: number): boolean {
  const d = month * 100 + day;
  const s = sm * 100 + sd;
  const e = em * 100 + ed;
  if (s <= e) return d >= s && d <= e;
  // wraps around year boundary (e.g. Dec 28 → Jan 3)
  return d >= s || d <= e;
}

export function getSeasonalSuggestions(date: Date = new Date()): SeasonalSuggestion[] {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return seasonalMap
    .filter((s) => s.ranges.some(([sm, sd, em, ed]) => isDateInRange(month, day, sm, sd, em, ed)))
    .map(({ presetId, name, reason }) => ({ presetId, name, reason }));
}

/* ── Neon mixing function ── */
export function mixNeonWithBase(basePreset: ThemePreset, neonPreset: ThemePreset): ThemePreset["colors"] {
  // Take structure/background from base, glow colors from neon
  return {
    background: basePreset.colors.background,
    card: basePreset.colors.card,
    muted: basePreset.colors.muted,
    secondary: basePreset.colors.secondary,
    border: neonPreset.colors.border,
    foreground: neonPreset.colors.foreground,
    cardForeground: neonPreset.colors.cardForeground,
    primary: neonPreset.colors.primary,
    primaryForeground: basePreset.colors.background,
    secondaryForeground: neonPreset.colors.cardForeground,
    mutedForeground: neonPreset.colors.mutedForeground,
    accent: neonPreset.colors.accent,
    accentForeground: basePreset.colors.background,
  };
}

/* ── Expanded font options ── */
export const displayFonts = [
  // Classic serifs (MS Word + Google Fonts)
  "Cormorant Garamond", "Playfair Display", "Lora", "Merriweather",
  "DM Serif Display", "EB Garamond", "Libre Baskerville", "Crimson Text",
  "Spectral", "Noto Serif Display", "Fraunces",
  // MS Word serif classics
  "Georgia", "Garamond", "Palatino Linotype", "Book Antiqua",
  "Times New Roman", "Cambria", "Constantia", "Bookman Old Style",
  // Fashion-forward & editorial
  "Bodoni Moda", "Italiana", "Didact Gothic", "Poiret One",
  "Yeseva One", "Antic Didone", "Oranienbaum", "Forum", "Unbounded",
  // MS Word display & decorative
  "Impact", "Copperplate Gothic Bold", "Rockwell",
  // Techy & futuristic
  "Orbitron", "Rajdhani", "Audiowide", "Michroma",
  "Share Tech Mono", "Exo 2", "Electrolize", "Oxanium",
  "Bruno Ace", "Chakra Petch",
];

export const bodyFonts = [
  // Clean modern sans
  "Outfit", "Inter", "DM Sans", "Nunito Sans", "Work Sans", "Raleway", "Source Sans 3",
  // Fashion & editorial sans
  "Jost", "Sora", "Space Grotesk", "Manrope", "Plus Jakarta Sans",
  "Urbanist", "Figtree", "Instrument Sans",
  // MS Word sans-serif classics
  "Arial", "Calibri", "Segoe UI", "Verdana", "Tahoma",
  "Trebuchet MS", "Candara", "Corbel", "Franklin Gothic Medium",
  "Century Gothic", "Gill Sans", "Lucida Sans",
  "Helvetica Neue", "Futura",
  // MS Word monospace
  "Courier New", "Consolas", "Lucida Console",
  // Techy & monospace (Google)
  "Share Tech", "Exo 2", "Rajdhani", "Chakra Petch",
  "IBM Plex Mono", "JetBrains Mono", "Fira Code", "Source Code Pro",
];

export const allFontFamilies = [...new Set([...displayFonts, ...bodyFonts])];

/* ── Persisted shape ── */
export interface ThemeSettings {
  presetId: string;
  neonOverlayId: string | null;
  fontDisplay: string;
  fontBody: string;
}

const defaultSettings: ThemeSettings = {
  presetId: "black-gold",
  neonOverlayId: null,
  fontDisplay: "Cormorant Garamond",
  fontBody: "Outfit",
};

const THEME_CACHE_KEY = "drip-theme-cache";

function getLocalSettings(): ThemeSettings | null {
  try {
    const cached = localStorage.getItem(THEME_CACHE_KEY);
    if (cached) return JSON.parse(cached) as ThemeSettings;
  } catch {}
  return null;
}

function setLocalSettings(settings: ThemeSettings) {
  try {
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(settings));
  } catch {}
}

/* ── Context ── */
interface ThemeContextType {
  settings: ThemeSettings;
  updateSettings: (s: ThemeSettings) => Promise<void>;
  saving: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/* ── Google Fonts loader ── */
function loadGoogleFonts(families: string[]) {
  const id = "dynamic-google-fonts";
  let link = document.getElementById(id) as HTMLLinkElement | null;
  const url = `https://fonts.googleapis.com/css2?${families
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@300;400;500;600;700`)
    .join("&")}&display=swap`;
  if (link) {
    link.href = url;
  } else {
    link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  }
}

/* ── Resolve final colors ── */
export function resolveColors(settings: ThemeSettings): ThemePreset["colors"] {
  const basePreset = themePresets.find((p) => p.id === settings.presetId) ?? themePresets[0];
  if (settings.neonOverlayId) {
    const neonPreset = neonPresets.find((p) => p.id === settings.neonOverlayId);
    if (neonPreset) return mixNeonWithBase(basePreset, neonPreset);
  }
  return basePreset.colors;
}

/* ── Apply to DOM ── */
function applyTheme(settings: ThemeSettings) {
  const c = resolveColors(settings);
  const root = document.documentElement;

  root.style.setProperty("--background", c.background);
  root.style.setProperty("--foreground", c.foreground);
  root.style.setProperty("--card", c.card);
  root.style.setProperty("--card-foreground", c.cardForeground);
  root.style.setProperty("--primary", c.primary);
  root.style.setProperty("--primary-foreground", c.primaryForeground);
  root.style.setProperty("--secondary", c.secondary);
  root.style.setProperty("--secondary-foreground", c.secondaryForeground);
  root.style.setProperty("--muted", c.muted);
  root.style.setProperty("--muted-foreground", c.mutedForeground);
  root.style.setProperty("--accent", c.accent);
  root.style.setProperty("--accent-foreground", c.accentForeground);
  root.style.setProperty("--border", c.border);
  root.style.setProperty("--input", c.border);
  root.style.setProperty("--ring", c.accent);
  root.style.setProperty("--popover", c.background);
  root.style.setProperty("--popover-foreground", c.foreground);

  // Sync neon accent with theme accent
  root.style.setProperty("--neon", c.accent);
  root.style.setProperty("--neon-glow", `0 0 8px hsl(${c.accent} / 0.5), 0 0 20px hsl(${c.accent} / 0.2)`);
  root.style.setProperty("--neon-glow-strong", `0 0 10px hsl(${c.accent} / 0.6), 0 0 30px hsl(${c.accent} / 0.3), 0 0 60px hsl(${c.accent} / 0.1)`);

  // Sync fonts
  const displayVal = `'${settings.fontDisplay}', serif`;
  const bodyVal = `'${settings.fontBody}', sans-serif`;
  root.style.setProperty("--font-display", displayVal);
  root.style.setProperty("--font-body", bodyVal);

  loadGoogleFonts([settings.fontDisplay, settings.fontBody]);
}

/* ── Provider ── */
export const ThemeSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    // Instantly apply cached theme to prevent flash
    const cached = getLocalSettings();
    if (cached) {
      setTimeout(() => applyTheme(cached), 0);
      return cached;
    }
    return defaultSettings;
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "theme")
        .single();
      if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
        const v = data.value as Record<string, unknown>;
        const loaded: ThemeSettings = {
          presetId: (v.presetId as string) ?? defaultSettings.presetId,
          neonOverlayId: (v.neonOverlayId as string) ?? null,
          fontDisplay: (v.fontDisplay as string) ?? defaultSettings.fontDisplay,
          fontBody: (v.fontBody as string) ?? defaultSettings.fontBody,
        };
        setSettings(loaded);
        setLocalSettings(loaded);
        applyTheme(loaded);
      } else {
        applyTheme(settings);
      }
    })();
  }, []);

  const updateSettings = useCallback(async (next: ThemeSettings) => {
    setSaving(true);
    applyTheme(next);
    setSettings(next);
    setLocalSettings(next); // Cache locally for instant reload

    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", "theme")
      .single();

    if (existing) {
      await supabase
        .from("site_settings")
        .update({ value: next as any })
        .eq("key", "theme");
    } else {
      await supabase
        .from("site_settings")
        .insert({ key: "theme", value: next as any });
    }
    setSaving(false);
  }, []);

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, saving }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeSettings = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      settings: defaultSettings,
      updateSettings: async () => {},
      saving: false,
    };
  }
  return ctx;
};
