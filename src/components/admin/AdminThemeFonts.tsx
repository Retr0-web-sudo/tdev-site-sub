import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Check, Eye, EyeOff, Zap, X, Sparkles, CalendarIcon, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useThemeSettings,
  themePresets,
  neonPresets,
  displayFonts,
  bodyFonts,
  resolveColors,
  getSeasonalSuggestions,
  type ThemeSettings,
} from "@/hooks/useThemeSettings";

/* ── Mini preview component ── */
const ThemePreviewPanel = ({ local }: { local: ThemeSettings }) => {
  const c = resolveColors(local);

  const bg = `hsl(${c.background})`;
  const fg = `hsl(${c.foreground})`;
  const card = `hsl(${c.card})`;
  const cardFg = `hsl(${c.cardForeground})`;
  const accent = `hsl(${c.accent})`;
  const accentFg = `hsl(${c.accentForeground})`;
  const muted = `hsl(${c.mutedForeground})`;
  const border = `hsl(${c.border})`;
  const secondary = `hsl(${c.secondary})`;

  const displayFont = `'${local.fontDisplay}', serif`;
  const bodyFont = `'${local.fontBody}', sans-serif`;

  return (
    <div
      className="rounded-xl overflow-hidden border shadow-lg"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      {/* Navbar preview */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ backgroundColor: bg, borderColor: border }}
      >
        <span style={{ fontFamily: displayFont, color: fg, fontSize: 18, letterSpacing: "0.12em", fontWeight: 300 }}>
          TDEV
        </span>
        <div className="flex gap-4">
          {["Femme", "Homme", "About"].map((n) => (
            <span key={n} style={{ fontFamily: bodyFont, color: muted, fontSize: 11, letterSpacing: "0.1em" }}>
              {n}
            </span>
          ))}
        </div>
      </div>

      {/* Hero preview */}
      <div
        className="relative flex flex-col items-center justify-center py-12"
        style={{ background: `linear-gradient(135deg, ${bg}, ${secondary})` }}
      >
        <span style={{ fontFamily: displayFont, color: fg, fontSize: 36, letterSpacing: "0.15em", fontWeight: 300 }}>
          TDEV
        </span>
        <span style={{ fontFamily: bodyFont, color: muted, fontSize: 10, letterSpacing: "0.3em", marginTop: 6, textTransform: "uppercase" }}>
          Global Collection
        </span>
        <div
          className="mt-4 px-5 py-1.5 rounded-sm border"
          style={{ borderColor: accent, color: accent, fontFamily: bodyFont, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase" }}
        >
          Explore
        </div>
      </div>

      {/* Cards preview */}
      <div className="px-5 py-5 flex gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 rounded-lg overflow-hidden" style={{ backgroundColor: card, border: `1px solid ${border}` }}>
            <div className="h-16" style={{ backgroundColor: secondary }} />
            <div className="p-2.5">
              <span style={{ fontFamily: displayFont, color: cardFg, fontSize: 11, fontWeight: 500 }}>
                Product {i}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span style={{ fontFamily: bodyFont, color: muted, fontSize: 9 }}>$49.00</span>
                <span className="px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: accent, color: accentFg, fontFamily: bodyFont, fontSize: 8 }}>
                  New
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer preview */}
      <div className="px-5 py-4 border-t" style={{ backgroundColor: fg, borderColor: border }}>
        <span style={{ fontFamily: displayFont, color: bg, fontSize: 14, letterSpacing: "0.12em", fontWeight: 300 }}>
          TDEV
        </span>
        <p style={{ fontFamily: bodyFont, color: `hsl(${c.primaryForeground})`, fontSize: 9, opacity: 0.5, marginTop: 4 }}>
          Sustainable fashion rooted in natural materials.
        </p>
      </div>
    </div>
  );
};

/* ── Category labels ── */
const categoryLabels: Record<string, string> = {
  core: "Core",
  neon: "Neon",
  holiday: "Holidays & Celebrations",
};

const AdminThemeFonts = () => {
  const { settings, updateSettings, saving } = useThemeSettings();
  const [local, setLocal] = useState<ThemeSettings>(settings);
  const [showPreview, setShowPreview] = useState(true);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([]);
  const [previewDate, setPreviewDate] = useState<Date | undefined>(undefined);

  // Seasonal auto-detection
  const seasonalSuggestions = useMemo(
    () => getSeasonalSuggestions(previewDate || new Date()),
    [previewDate]
  );
  const activeSuggestions = seasonalSuggestions.filter(
    (s) => !dismissedSuggestions.includes(s.presetId) && s.presetId !== local.presetId
  );

  // Sync when settings load async
  const [initialized, setInitialized] = useState(false);
  if (!initialized && settings.presetId !== local.presetId) {
    setLocal(settings);
    setInitialized(true);
  }

  const save = async () => {
    await updateSettings(local);
    toast.success("Theme updated! Changes are live.");
  };

  const selectClasses = "mt-1 w-full bg-card border border-border rounded-md px-3 py-2 font-body text-sm text-foreground outline-none";

  const selectedBase = themePresets.find((p) => p.id === local.presetId);
  const selectedNeon = local.neonOverlayId ? neonPresets.find((p) => p.id === local.neonOverlayId) : null;

  // Group presets by category
  const grouped = themePresets.reduce<Record<string, typeof themePresets>>((acc, p) => {
    (acc[p.category] = acc[p.category] || []).push(p);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-2xl font-light">Theme & Fonts</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="text-muted-foreground hover:text-foreground gap-2"
        >
          {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          {showPreview ? "Hide Preview" : "Show Preview"}
        </Button>
      </div>
      <p className="font-body text-sm text-muted-foreground mb-8">
        Choose a theme preset, optionally layer a neon glow, and pick your fonts.
      </p>

      {/* ── Date Picker for Suggestion Preview ── */}
      <div className="mb-6 flex items-center gap-3">
        <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground shrink-0">
          Preview suggestions for:
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[200px] justify-start text-left font-normal text-sm",
                !previewDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {previewDate ? format(previewDate, "PPP") : "Today"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={previewDate}
              onSelect={setPreviewDate}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        {previewDate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewDate(undefined)}
            className="text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw size={14} />
            Reset to today
          </Button>
        )}
      </div>

      {/* ── Seasonal Suggestions ── */}
      {activeSuggestions.length > 0 && (
        <div className="mb-8 space-y-2">
          {activeSuggestions.map((s) => (
            <div
              key={s.presetId}
              className="flex items-center gap-3 p-3 rounded-lg border border-accent/30 bg-accent/5"
            >
              <Sparkles size={18} className="text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-body text-sm text-primary-foreground dark:text-foreground">
                  <strong className="text-accent">{s.reason}</strong> — Try the <em className="text-accent/80">{s.name}</em> theme!
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 text-xs border-accent/40 text-accent hover:bg-accent hover:text-accent-foreground"
                onClick={() => setLocal({ ...local, presetId: s.presetId })}
              >
                Apply
              </Button>
              <button
                onClick={() => setDismissedSuggestions([...dismissedSuggestions, s.presetId])}
                className="text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={`grid gap-8 ${showPreview ? "lg:grid-cols-[1fr_320px]" : "grid-cols-1 max-w-3xl"}`}>
        {/* Left: controls */}
        <div>
          {/* ── Theme presets by category ── */}
          {(["core", "holiday", "neon"] as const).map((cat) => (
            <div key={cat} className="mb-8">
              <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground mb-3 block">
                {categoryLabels[cat]} ({grouped[cat]?.length ?? 0})
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(grouped[cat] ?? []).map((preset) => {
                  const selected = local.presetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        // If selecting a neon as base, clear overlay
                        const neonOverlayId = preset.category === "neon" ? null : local.neonOverlayId;
                        setLocal({ ...local, presetId: preset.id, neonOverlayId });
                      }}
                      className={`relative rounded-lg border-2 p-3 transition-all text-left bg-card ${
                        selected
                          ? "border-accent ring-1 ring-accent"
                           : "border-border hover:border-foreground/30"
                      }`}
                    >
                      <div className="flex gap-1 mb-2">
                        {[preset.colors.background, preset.colors.foreground, preset.colors.accent, preset.colors.secondary].map((c, i) => (
                          <div key={i} className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: `hsl(${c})` }} />
                        ))}
                      </div>
                      <span className="font-body text-xs text-card-foreground font-medium">{preset.name}</span>
                      <span className="block font-body text-[10px] text-card-foreground/60 capitalize">{preset.mode}</span>
                      {selected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                          <Check size={12} className="text-accent-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* ── Neon Overlay Mixer ── */}
          {selectedBase && selectedBase.category !== "neon" && (
            <div className="mb-10 p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-accent" />
                <Label className="font-body text-xs tracking-wider uppercase text-foreground/80">
                  Neon Overlay — Mix a glow onto "{selectedBase.name}"
                </Label>
              </div>

              {selectedNeon && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-body text-xs text-foreground">
                    Active: <strong>{selectedNeon.name}</strong>
                  </span>
                  <button
                    onClick={() => setLocal({ ...local, neonOverlayId: null })}
                    className="ml-auto text-muted-foreground/60 hover:text-foreground transition-colors"
                    title="Remove neon overlay"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {neonPresets.map((neon) => {
                  const active = local.neonOverlayId === neon.id;
                  return (
                    <button
                      key={neon.id}
                      onClick={() => setLocal({ ...local, neonOverlayId: active ? null : neon.id })}
                      className={`rounded-md border-2 p-2 transition-all text-center ${
                        active
                          ? "border-accent ring-1 ring-accent"
                          : "border-border hover:border-foreground/30"
                      }`}
                    >
                      <div className="flex justify-center gap-1 mb-1">
                        {[neon.colors.foreground, neon.colors.accent].map((c, i) => (
                          <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: `hsl(${c})`, boxShadow: `0 0 8px hsl(${c})` }} />
                        ))}
                      </div>
                      <span className="font-body text-[10px] text-foreground">{neon.name.replace("Neon ", "")}</span>
                    </button>
                  );
                })}
              </div>

              {!selectedNeon && (
                <p className="font-body text-[10px] text-muted-foreground/50 mt-2">
                  Select a neon to overlay its glow colors onto the current base theme.
                </p>
              )}
            </div>
          )}

          {/* ── Fonts ── */}
          <div className="space-y-6 mb-8">
            <div>
              <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">
                Display Font ({displayFonts.length} options)
              </Label>
              <select
                value={local.fontDisplay}
                onChange={(e) => setLocal({ ...local, fontDisplay: e.target.value })}
                className={selectClasses}
              >
                {displayFonts.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: `'${f}', serif` }}>{f}</option>
                ))}
              </select>
              <p className="mt-2 font-body text-xs text-muted-foreground">
                Preview:{" "}
                <span style={{ fontFamily: `'${local.fontDisplay}', serif` }} className="text-lg text-foreground">
                  The quick brown fox
                </span>
              </p>
            </div>

            <div>
              <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">
                Body Font ({bodyFonts.length} options)
              </Label>
              <select
                value={local.fontBody}
                onChange={(e) => setLocal({ ...local, fontBody: e.target.value })}
                className={selectClasses}
              >
                {bodyFonts.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: `'${f}', sans-serif` }}>{f}</option>
                ))}
              </select>
              <p className="mt-2 text-xs text-muted-foreground">
                Preview:{" "}
                <span style={{ fontFamily: `'${local.fontBody}', sans-serif` }} className="text-sm text-foreground">
                  The quick brown fox jumps over the lazy dog
                </span>
              </p>
            </div>
          </div>

          <Button
            onClick={save}
            disabled={saving}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-xs tracking-[0.2em] uppercase"
          >
            {saving ? "Saving..." : "Apply & Save"}
          </Button>
        </div>

        {/* Right: live preview */}
        {showPreview && (
          <div className="hidden lg:block sticky top-8 self-start">
            <p className="font-body text-[10px] tracking-wider uppercase text-muted-foreground mb-3">
              Live Preview {selectedNeon && `(${selectedBase?.name} + ${selectedNeon.name})`}
            </p>
            <ThemePreviewPanel local={local} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminThemeFonts;
