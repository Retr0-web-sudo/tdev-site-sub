import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Upload, Trash2 } from "lucide-react";

interface GameRule {
  maxScore: number;
  discount: number;
  label: string;
}

interface GameSettings {
  rules: {
    memory: GameRule;
    jigsaw: GameRule;
    sliding: GameRule;
    maze: GameRule;
  };
  memoryImages: string[];
  jigsawImages: string[];
}

const DEFAULT_SETTINGS: GameSettings = {
  rules: {
    memory: { maxScore: 12, discount: 20, label: "Memory Champion" },
    jigsaw: { maxScore: 20, discount: 15, label: "Jigsaw Master" },
    sliding: { maxScore: 40, discount: 10, label: "Slider Pro" },
    maze: { maxScore: 35, discount: 10, label: "Maze Runner" },
  },
  memoryImages: [],
  jigsawImages: [],
};

const AdminGameSettings = () => {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "game_settings")
      .single();
    if (data?.value) {
      setSettings({ ...DEFAULT_SETTINGS, ...(data.value as any) });
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "game_settings", value: settings as any }, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Game settings saved");
    }
  };

  const updateRule = (game: keyof GameSettings["rules"], field: keyof GameRule, value: string | number) => {
    setSettings((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        [game]: { ...prev.rules[game], [field]: field === "label" ? value : Number(value) },
      },
    }));
  };

  const handleImageUpload = async (target: "memoryImages" | "jigsawImages", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(target);

    const path = `game-images/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("custom-designs").upload(path, file);
    if (error) {
      toast.error("Upload failed");
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("custom-designs").getPublicUrl(path);
    setSettings((prev) => ({
      ...prev,
      [target]: [...prev[target], urlData.publicUrl],
    }));
    setUploading(null);
    toast.success("Image uploaded");
  };

  const removeImage = (target: "memoryImages" | "jigsawImages", index: number) => {
    setSettings((prev) => ({
      ...prev,
      [target]: prev[target].filter((_, i) => i !== index),
    }));
  };

  const games: { key: keyof GameSettings["rules"]; name: string; scoreLabel: string }[] = [
    { key: "memory", name: "Memory", scoreLabel: "Max Moves" },
    { key: "jigsaw", name: "Jigsaw", scoreLabel: "Max Moves" },
    { key: "sliding", name: "Slider", scoreLabel: "Max Moves" },
    { key: "maze", name: "Maze", scoreLabel: "Max Steps" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-light">Game Settings</h2>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Adjust reward thresholds and manage game images.
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="gap-2">
          <Save size={14} /> {saving ? "Saving…" : "Save All"}
        </Button>
      </div>

      {/* Reward rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((g) => (
          <div key={g.key} className="p-5 rounded-xl border border-border bg-card space-y-4">
            <h3 className="font-display text-lg">{g.name}</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">{g.scoreLabel}</Label>
                <Input
                  type="number"
                  min={1}
                  value={settings.rules[g.key].maxScore}
                  onChange={(e) => updateRule(g.key, "maxScore", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Discount %</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.rules[g.key].discount}
                  onChange={(e) => updateRule(g.key, "discount", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Label</Label>
                <Input
                  value={settings.rules[g.key].label}
                  onChange={(e) => updateRule(g.key, "label", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image management */}
      {(["memoryImages", "jigsawImages"] as const).map((target) => (
        <div key={target} className="p-5 rounded-xl border border-border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg">
              {target === "memoryImages" ? "Memory Card Images" : "Jigsaw Puzzle Images"}
            </h3>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(target, e)}
              />
              <Button asChild size="sm" variant="outline" className="gap-2" disabled={uploading === target}>
                <span><Upload size={14} /> {uploading === target ? "Uploading…" : "Add Image"}</span>
              </Button>
            </label>
          </div>
          <p className="font-body text-xs text-muted-foreground">
            {target === "memoryImages"
              ? "Upload images to replace default emoji cards. Need pairs of 8 (16 total cards)."
              : "Upload images for the jigsaw puzzle. Players will piece them together."}
          </p>
          <div className="flex flex-wrap gap-3">
            {settings[target].length === 0 && (
              <p className="text-xs text-muted-foreground italic">Using default images. Add custom ones above.</p>
            )}
            {settings[target].map((url, i) => (
              <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(target, i)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Trash2 size={16} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminGameSettings;
