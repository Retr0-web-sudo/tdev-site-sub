import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AdminPhilosophy = () => {
  const [philosophy, setPhilosophy] = useState({ title: "", content: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "philosophy")
      .single();
    if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
      setPhilosophy(data.value as typeof philosophy);
    }
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ value: philosophy as any })
      .eq("key", "philosophy");
    setSaving(false);
    if (error) toast.error("Failed to save");
    else toast.success("Philosophy updated!");
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl font-light mb-1">Philosophy</h2>
      <p className="font-body text-sm text-muted-foreground mb-8">
        Edit the About / Philosophy section
      </p>

      <div className="space-y-6">
        <div>
          <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">
            Title
          </Label>
          <Input
            value={philosophy.title}
            onChange={(e) => setPhilosophy({ ...philosophy, title: e.target.value })}
            className="mt-1 bg-secondary border-border font-body text-sm"
          />
        </div>
        <div>
          <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">
            Content
          </Label>
          <Textarea
            value={philosophy.content}
            onChange={(e) => setPhilosophy({ ...philosophy, content: e.target.value })}
            className="mt-1 bg-secondary border-border font-body text-sm min-h-[150px]"
          />
        </div>
        <Button
          onClick={save}
          disabled={saving}
          className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-xs tracking-[0.2em] uppercase"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default AdminPhilosophy;
