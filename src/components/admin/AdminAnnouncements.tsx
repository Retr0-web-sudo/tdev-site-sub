import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  link_text: string | null;
  link_url: string | null;
  active: boolean;
  display_order: number | null;
}

const AdminAnnouncements = () => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("display_order", { ascending: true });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const addNew = async () => {
    const { error } = await supabase.from("announcements").insert({
      title: "New Announcement",
      message: "Your announcement message here",
      active: false,
      display_order: items.length,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Announcement created");
    fetchItems();
  };

  const update = async (id: string, updates: Partial<Announcement>) => {
    const { error } = await supabase.from("announcements").update(updates).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  if (loading) return <p className="text-muted-foreground font-body text-sm">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl text-card-foreground">Announcements</h2>
          <p className="font-body text-xs text-muted-foreground mt-1">
            Rotating banner shown at the top of the site
          </p>
        </div>
        <Button onClick={addNew} size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus size={14} /> Add
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-muted-foreground font-body text-sm py-8 text-center">
          No announcements yet. Click "Add" to create one.
        </p>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="border border-border rounded-lg p-4 bg-card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-muted-foreground/40" />
                <Switch
                  checked={item.active}
                  onCheckedChange={(active) => update(item.id, { active })}
                />
                <span className="font-body text-[10px] tracking-wider uppercase text-muted-foreground">
                  {item.active ? "Active" : "Inactive"}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => remove(item.id)} className="text-destructive hover:text-destructive">
                <Trash2 size={14} />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="font-body text-xs text-muted-foreground">Title (internal)</Label>
                <Input
                  value={item.title}
                  onChange={(e) => update(item.id, { title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="font-body text-xs text-muted-foreground">Message</Label>
                <Input
                  value={item.message}
                  onChange={(e) => update(item.id, { message: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="font-body text-xs text-muted-foreground">Link Text</Label>
                <Input
                  value={item.link_text || ""}
                  onChange={(e) => update(item.id, { link_text: e.target.value || null })}
                  placeholder="Shop Now"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="font-body text-xs text-muted-foreground">Link URL</Label>
                <Input
                  value={item.link_url || ""}
                  onChange={(e) => update(item.id, { link_url: e.target.value || null })}
                  placeholder="/category/femme"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAnnouncements;
