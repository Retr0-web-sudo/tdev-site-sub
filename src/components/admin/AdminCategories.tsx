import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { slugify } from "@/lib/utils";

const AdminCategories = () => {
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("display_order");
    if (data) setCategories(data);
  };

  const save = async () => {
    if (!form.name || !form.slug) return toast.error("Name and slug required");
    if (editing) {
      await supabase.from("categories").update(form).eq("id", editing);
      toast.success("Category updated");
    } else {
      await supabase.from("categories").insert(form);
      toast.success("Category created");
    }
    setEditing(null);
    setForm({ name: "", slug: "", description: "" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    toast.success("Category deleted");
    load();
  };

  const startEdit = (cat: Tables<"categories">) => {
    setEditing(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || "" });
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-light mb-1">Categories</h2>
      <p className="font-body text-sm text-muted-foreground mb-8">Manage product categories</p>

      {/* Form */}
      <div className="border border-border rounded-lg p-5 bg-card mb-6 max-w-2xl">
        <h3 className="font-body text-sm font-medium text-foreground mb-4">
          {editing ? "Edit Category" : "Add Category"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })}
              className="mt-1 bg-secondary border-border font-body text-sm"
            />
          </div>
          <div>
            <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Slug</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="bg-secondary border-border font-body text-sm flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => setForm((prev) => ({ ...prev, slug: slugify(prev.name) }))} className="border-border text-muted-foreground font-body text-xs gap-1 shrink-0" title="Regenerate from name">
                <Wand2 size={12} /> Auto
              </Button>
            </div>
          </div>
          <div>
            <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 bg-secondary border-border font-body text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={save} className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-xs tracking-wider">
            <Plus size={14} className="mr-1" /> {editing ? "Update" : "Add"}
          </Button>
          {editing && (
            <Button variant="outline" onClick={() => { setEditing(null); setForm({ name: "", slug: "", description: "" }); }}
              className="border-border text-muted-foreground font-body text-xs">
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="text-left px-5 py-3 font-body text-xs tracking-wider uppercase text-muted-foreground">Name</th>
              <th className="text-left px-5 py-3 font-body text-xs tracking-wider uppercase text-muted-foreground">Slug</th>
              <th className="text-left px-5 py-3 font-body text-xs tracking-wider uppercase text-muted-foreground">Description</th>
              <th className="text-right px-5 py-3 font-body text-xs tracking-wider uppercase text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 font-body text-sm text-foreground">{cat.name}</td>
                <td className="px-5 py-3 font-body text-xs text-muted-foreground">{cat.slug}</td>
                <td className="px-5 py-3 font-body text-xs text-muted-foreground">{cat.description}</td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => startEdit(cat)} className="text-muted-foreground hover:text-accent mr-3 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => remove(cat.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCategories;
