import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Image as ImageIcon, Save } from "lucide-react";
import { toast } from "sonner";

interface CarouselSlide {
  image_url: string;
  alt_text: string;
}

interface CarouselConfig {
  femme: CarouselSlide[];
  homme: CarouselSlide[];
  global: CarouselSlide[];
}

const defaultConfig: CarouselConfig = {
  femme: [],
  homme: [],
  global: [],
};

const AdminCarousels = () => {
  const [config, setConfig] = useState<CarouselConfig>(defaultConfig);
  const [activeCategory, setActiveCategory] = useState<keyof CarouselConfig>("femme");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("key", "carousel_images")
      .single();
    if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
      const val = data.value as Record<string, unknown>;
      setConfig({
        femme: (val.femme as CarouselSlide[]) || [],
        homme: (val.homme as CarouselSlide[]) || [],
        global: (val.global as CarouselSlide[]) || [],
      });
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const val = JSON.parse(JSON.stringify(config));
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "carousel_images")
        .single();

      if (existing) {
        await supabase
          .from("site_settings")
          .update({ value: val })
          .eq("key", "carousel_images");
      } else {
        await supabase
          .from("site_settings")
          .insert([{ key: "carousel_images", value: val }]);
      }
      toast.success("Carousel images saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const addSlide = () => {
    setConfig((prev) => ({
      ...prev,
      [activeCategory]: [...prev[activeCategory], { image_url: "", alt_text: "" }],
    }));
  };

  const removeSlide = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      [activeCategory]: prev[activeCategory].filter((_, i) => i !== index),
    }));
  };

  const updateSlide = (index: number, field: keyof CarouselSlide, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [activeCategory]: prev[activeCategory].map((slide, i) =>
        i === index ? { ...slide, [field]: value } : slide
      ),
    }));
  };

  const slides = config[activeCategory];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-light">Carousel Images</h2>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Manage hero carousel images for each category page
          </p>
        </div>
        <Button
          onClick={save}
          disabled={saving}
          className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-xs tracking-wider"
        >
          <Save size={14} className="mr-1" />
          {saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6">
        {(["femme", "homme", "global"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-md font-body text-xs tracking-wider capitalize transition-colors ${
              activeCategory === cat
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {cat} ({config[cat].length})
          </button>
        ))}
      </div>

      {/* Slides list */}
      <div className="space-y-4 mb-6">
        {slides.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-12 text-center">
            <ImageIcon size={32} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-body text-sm text-muted-foreground">
              No carousel images for {activeCategory}
            </p>
            <p className="font-body text-xs text-muted-foreground/60 mt-1">
              Add image URLs to create carousel slides. Falls back to default images if empty.
            </p>
          </div>
        ) : (
          slides.map((slide, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-4 bg-card flex gap-4 items-start"
            >
              <GripVertical size={16} className="text-muted-foreground/40 mt-2 shrink-0" />

              {/* Preview */}
              <div className="w-24 h-16 bg-secondary rounded overflow-hidden shrink-0">
                {slide.image_url ? (
                  <img
                    src={slide.image_url}
                    alt={slide.alt_text}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={16} className="text-muted-foreground/40" />
                  </div>
                )}
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">
                    Image URL
                  </Label>
                  <Input
                    value={slide.image_url}
                    onChange={(e) => updateSlide(index, "image_url", e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1 bg-secondary border-border font-body text-sm"
                  />
                </div>
                <div>
                  <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">
                    Alt Text
                  </Label>
                  <Input
                    value={slide.alt_text}
                    onChange={(e) => updateSlide(index, "alt_text", e.target.value)}
                    placeholder="Description of the image"
                    className="mt-1 bg-secondary border-border font-body text-sm"
                  />
                </div>
              </div>

              <button
                onClick={() => removeSlide(index)}
                className="text-muted-foreground hover:text-destructive transition-colors mt-2"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <Button
        onClick={addSlide}
        variant="outline"
        className="border-border text-muted-foreground font-body text-xs tracking-wider"
      >
        <Plus size={14} className="mr-1" /> Add Slide
      </Button>
    </div>
  );
};

export default AdminCarousels;
