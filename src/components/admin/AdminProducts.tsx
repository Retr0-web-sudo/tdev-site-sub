import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus, Package, AlertTriangle, Upload, Download, Copy, Image as ImageIcon, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import AdminCSVTemplate from "./AdminCSVTemplate";
import { slugify } from "@/lib/utils";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  compare_at_price: null as number | null,
  category_id: null as string | null,
  in_stock: true,
  featured: false,
  sku: "",
  stock_quantity: 0,
  images: [] as string[],
  sizes: [] as string[],
  colors: [] as string[],
  weight: null as number | null,
  material: "",
  brand: "",
  tags: [] as string[],
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [imageInput, setImageInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importReport, setImportReport] = useState<{
    inserted: number;
    updated: number;
    categoriesCreated: number;
    errors: { row: number; reason: string }[];
    missingHeaders?: string[];
  } | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [filterStock, setFilterStock] = useState<"all" | "in" | "out">("all");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("display_order"),
    ]);
    if (prods) setProducts(prods);
    if (cats) setCategories(cats);
  };

  const save = async () => {
    if (!form.name || !form.slug) return toast.error("Name and slug are required");

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      price: form.price,
      compare_at_price: form.compare_at_price,
      category_id: form.category_id,
      in_stock: form.stock_quantity > 0 ? form.in_stock : false,
      featured: form.featured,
      sku: form.sku || null,
      stock_quantity: form.stock_quantity,
      images: form.images,
      sizes: form.sizes,
      colors: form.colors,
      weight: form.weight,
      material: form.material || null,
      brand: form.brand || null,
      tags: form.tags,
    };

    if (editing) {
      await supabase.from("products").update(payload as any).eq("id", editing);
      toast.success("Product updated");
    } else {
      await supabase.from("products").insert(payload as any);
      toast.success("Product created");
    }

    resetForm();
    await load();
  };

  const remove = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    toast.success("Product deleted");
    load();
  };

  const duplicate = async (p: Tables<"products">) => {
    const pAny = p as any;
    const newSlug = `${p.slug}-copy-${Date.now().toString(36)}`;
    const { id, created_at, updated_at, ...rest } = p as any;
    const payload = { ...rest, name: `${p.name} (Copy)`, slug: newSlug, sku: p.sku ? `${p.sku}-COPY` : null, shopify_product_id: null, shopify_synced_at: null };
    const { data, error } = await supabase.from("products").insert(payload as any).select().single();
    if (error) return toast.error("Failed to duplicate");
    toast.success("Product duplicated — opening for edit");
    await load();
    if (data) startEdit(data as any);
  };

  const uploadImage = async (file: File) => {
    const path = `product-images/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("custom-designs").upload(path, file);
    if (error) { toast.error("Upload failed"); return null; }
    const { data } = supabase.storage.from("custom-designs").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    toast.info(`Uploading ${files.length} image(s)…`);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadImage(file);
      if (url) urls.push(url);
    }
    if (urls.length > 0) {
      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
      toast.success(`Added ${urls.length} image(s)`);
    }
  };

  const startEdit = (p: Tables<"products">) => {
    const pAny = p as any;
    setEditing(p.id);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description || "",
      price: p.price,
      compare_at_price: p.compare_at_price,
      category_id: p.category_id,
      in_stock: p.in_stock ?? true,
      featured: p.featured ?? false,
      sku: p.sku || "",
      stock_quantity: p.stock_quantity || 0,
      images: p.images || [],
      sizes: p.sizes || [],
      colors: p.colors || [],
      weight: pAny.weight ?? null,
      material: pAny.material || "",
      brand: pAny.brand || "",
      tags: pAny.tags || [],
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(false);
    setImageInput("");
    setSizeInput("");
    setColorInput("");
    setTagInput("");
  };

  const getCategoryName = (id: string | null) => {
    if (!id) return "—";
    return categories.find((c) => c.id === id)?.name || "—";
  };

  const addToArray = (field: "images" | "sizes" | "colors" | "tags", value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    setForm((prev) => ({ ...prev, [field]: [...prev[field], value.trim()] }));
    setter("");
  };

  const removeFromArray = (field: "images" | "sizes" | "colors" | "tags", index: number) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  // ── CSV Export ──
  const exportCSV = () => {
    const headers = ["name","slug","sku","brand","material","weight","price","compare_at_price","stock_quantity","in_stock","featured","category","sizes","colors","tags","images","videos","description"];
    const rows = products.map((p) => {
      const pAny = p as any;
      return [
        p.name, p.slug, p.sku || "", pAny.brand || "", pAny.material || "", pAny.weight ?? "",
        p.price, p.compare_at_price ?? "", p.stock_quantity, p.in_stock ? "true" : "false",
        p.featured ? "true" : "false", getCategoryName(p.category_id),
        (p.sizes || []).join("|"), (p.colors || []).join("|"),
        (pAny.tags || []).join("|"), (p.images || []).join("|"),
        (pAny.videos || []).join("|"),
        (p.description || "").replace(/\n/g, "\\n"),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${products.length} products`);
  };

  // ── CSV / XLSX Import ──
  // Parse a CSV string into rows. Respects quoted commas and newlines.
  const parseCSV = (input: string): string[][] => {
    const rows: string[][] = [];
    let cur: string[] = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < input.length; i++) {
      const c = input[i];
      if (inQuotes) {
        if (c === '"' && input[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else { field += c; }
      } else {
        if (c === '"') { inQuotes = true; }
        else if (c === ",") { cur.push(field); field = ""; }
        else if (c === "\n" || c === "\r") {
          if (c === "\r" && input[i + 1] === "\n") i++;
          cur.push(field); field = "";
          if (cur.some((v) => v.trim() !== "")) rows.push(cur);
          cur = [];
        } else { field += c; }
      }
    }
    if (field.length || cur.length) { cur.push(field); if (cur.some((v) => v.trim() !== "")) rows.push(cur); }
    return rows;
  };

  // Parse uploaded file (CSV or XLSX) into a uniform string[][] grid.
  const parseFile = async (file: File): Promise<string[][]> => {
    const name = file.name.toLowerCase();
    const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls") ||
      file.type.includes("spreadsheet") || file.type.includes("excel");
    if (isExcel) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "", raw: false }) as string[][];
      return grid.filter((r) => r.some((v) => String(v ?? "").trim() !== ""));
    }
    let text = await file.text();
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM
    return parseCSV(text);
  };

  const REQUIRED_HEADERS = ["name"];
  const KNOWN_HEADERS = [
    "name","slug","sku","brand","material","weight","price","compare_at_price",
    "stock_quantity","in_stock","featured","category","sizes","colors","tags",
    "images","videos","description",
  ];

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    setImportReport(null);
    const errors: { row: number; reason: string }[] = [];
    let categoriesCreated = 0;
    let inserted = 0;
    let updated = 0;

    let allRows: string[][];
    try {
      allRows = await parseFile(file);
    } catch (err: any) {
      const msg = err?.message || String(err);
      toast.error(`Failed to parse file: ${msg}`);
      setImportReport({ inserted: 0, updated: 0, categoriesCreated: 0, errors: [{ row: 0, reason: `Parse error: ${msg}` }] });
      return;
    }

    if (allRows.length < 2) {
      toast.error("File must have a header row and at least one data row");
      return;
    }

    const headers = allRows[0].map((h) => String(h ?? "").replace(/^\uFEFF/, "").trim().toLowerCase());
    const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      const msg = `Missing required column(s): ${missing.join(", ")}. Found: ${headers.join(", ") || "(none)"}`;
      toast.error(msg);
      setImportReport({ inserted: 0, updated: 0, categoriesCreated: 0, errors: [], missingHeaders: missing });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("You must be signed in to import products"); return; }
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      const msg = "Permission denied: only admin users can import products.";
      toast.error(msg);
      setImportReport({ inserted: 0, updated: 0, categoriesCreated: 0, errors: [{ row: 0, reason: msg }] });
      return;
    }

    // Pre-load existing products (for SKU upsert + slug collisions)
    const { data: existingProducts } = await supabase.from("products").select("id, sku, slug");
    const bySku = new Map<string, { id: string; slug: string }>();
    const usedSlugs = new Set<string>();
    for (const p of existingProducts || []) {
      if (p.sku) bySku.set(p.sku.toLowerCase(), { id: p.id, slug: p.slug });
      usedSlugs.add(p.slug);
    }

    // Category map
    const catByName = new Map<string, { id: string; name: string }>();
    for (const c of categories) catByName.set(c.name.toLowerCase(), { id: c.id, name: c.name });
    const usedCategorySlugs = new Set<string>(categories.map((c) => c.slug));

    const slugifyLocal = (s: string) =>
      s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";

    const resolveCategoryId = async (name: string, rowNum: number): Promise<string | null> => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const key = trimmed.toLowerCase();
      const hit = catByName.get(key);
      if (hit) return hit.id;
      let baseSlug = slugifyLocal(trimmed);
      let slug = baseSlug;
      let n = 2;
      while (usedCategorySlugs.has(slug)) slug = `${baseSlug}-${n++}`;
      const { data: newCat, error: catErr } = await supabase
        .from("categories").insert({ name: trimmed, slug } as any).select("id, name, slug").single();
      if (catErr || !newCat) {
        errors.push({ row: rowNum, reason: `Failed to create category "${trimmed}": ${catErr?.message || "unknown"}` });
        return null;
      }
      usedCategorySlugs.add(newCat.slug);
      catByName.set(key, { id: newCat.id, name: newCat.name });
      categoriesCreated++;
      return newCat.id;
    };

    // Name-based category rule
    const categoryFromName = (name: string): string => {
      const n = name.toLowerCase();
      if (n.includes("girly")) return "FEMME";
      if (n.includes("boi")) return "HOMME";
      if (n.includes("global")) return "GLOBAL";
      return "T-SHIRTS";
    };

    for (let i = 1; i < allRows.length; i++) {
      const rowNum = i + 1;
      try {
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = String(allRows[i][idx] ?? "").trim(); });

        if (!row.name) { errors.push({ row: rowNum, reason: "Missing required field 'name'" }); continue; }

        const price = row.price ? parseFloat(row.price) : 0;
        if (row.price && Number.isNaN(price)) { errors.push({ row: rowNum, reason: `Invalid price "${row.price}"` }); continue; }
        if (price < 0) { errors.push({ row: rowNum, reason: "Price cannot be negative" }); continue; }

        // Stock defaults — blank/0 → 10, always in_stock=true
        let stock_quantity = 10;
        if (row.stock_quantity !== undefined && row.stock_quantity !== "") {
          const parsed = parseInt(row.stock_quantity, 10);
          if (!Number.isNaN(parsed) && parsed > 0) stock_quantity = parsed;
        }

        // SKU — generate from slug + random suffix if missing
        let sku = row.sku?.trim() || "";
        const baseSlugForSku = slugifyLocal(row.slug || row.name);
        if (!sku) sku = `${baseSlugForSku}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();

        // Category — ignore CSV value, derive from product name
        const targetCatName = categoryFromName(row.name);
        const category_id = await resolveCategoryId(targetCatName, rowNum);

        const basePayload: any = {
          name: row.name,
          description: row.description?.replace(/\\n/g, "\n") || null,
          price,
          compare_at_price: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
          brand: row.brand || null,
          material: row.material || null,
          weight: row.weight ? parseFloat(row.weight) : null,
          stock_quantity,
          in_stock: true,
          status: 'published',
          published: true,
          is_visible: true,
          published_at: new Date().toISOString(),
          featured: row.featured ? row.featured.toLowerCase() === "true" : false,
          category_id,
          sizes: row.sizes ? row.sizes.split("|").map((s) => s.trim()).filter(Boolean) : [],
          colors: row.colors ? row.colors.split("|").map((s) => s.trim()).filter(Boolean) : [],
          tags: row.tags ? row.tags.split("|").map((s) => s.trim()).filter(Boolean) : [],
          images: row.images ? row.images.split("|").map((s) => s.trim()).filter(Boolean) : [],
          videos: row.videos ? row.videos.split("|").map((s) => s.trim()).filter(Boolean) : [],
          sku,
        };

        const existing = bySku.get(sku.toLowerCase());
        if (existing) {
          const { error: updErr } = await supabase.from("products").update(basePayload).eq("id", existing.id);
          if (updErr) errors.push({ row: rowNum, reason: `Update failed: ${updErr.message}` });
          else updated++;
        } else {
          // unique slug
          let baseSlug = slugifyLocal(row.slug || row.name);
          let slug = baseSlug;
          let n = 2;
          while (usedSlugs.has(slug)) slug = `${baseSlug}-${n++}`;
          usedSlugs.add(slug);
          const { data: newRow, error: insErr } = await supabase.from("products").insert({ ...basePayload, slug }).select("id").single();
          if (insErr) errors.push({ row: rowNum, reason: `Insert failed: ${insErr.message}` });
          else {
            inserted++;
            if (newRow) bySku.set(sku.toLowerCase(), { id: newRow.id, slug });
          }
        }
      } catch (err: any) {
        errors.push({ row: rowNum, reason: err?.message || String(err) });
      }
    }

    setImportReport({ inserted, updated, categoriesCreated, errors });
    const summary = `${inserted} added, ${updated} updated, ${errors.length} errors`;
    if (errors.length === 0) toast.success(`Import complete — ${summary}`);
    else if (inserted + updated > 0) toast.warning(`Import finished — ${summary}`);
    else toast.error(`Import failed — ${summary}`);
    load();
  };


  const lowStockProducts = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 5);

  const inputClass = "mt-1 bg-card border-border font-body text-sm";
  const labelClass = "font-body text-xs tracking-wider uppercase text-muted-foreground";

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-light">Products</h2>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Manage your product catalog, variants, and stock levels
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <AdminCSVTemplate />
          <Button variant="outline" onClick={exportCSV} className="border-border text-muted-foreground font-body text-xs tracking-wider gap-1.5">
            <Download size={14} /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="border-border text-muted-foreground font-body text-xs tracking-wider gap-1.5">
            <Upload size={14} /> Import CSV / XLSX
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleImport} className="hidden" />
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-xs tracking-wider">
              <Plus size={14} className="mr-1" /> Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Import report */}
      {importReport && (
        <div className="mb-6 p-4 rounded-lg border border-border bg-card">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="font-body text-sm font-medium">
                Import result: <span className="text-green-400">{importReport.inserted} added</span>
                <span className="text-blue-400">, {importReport.updated} updated</span>
                {importReport.categoriesCreated > 0 && <span className="text-blue-400">, {importReport.categoriesCreated} categor{importReport.categoriesCreated === 1 ? "y" : "ies"} created</span>}
                {importReport.errors.length > 0 && <span className="text-red-400">, {importReport.errors.length} failed</span>}
              </p>
              {importReport.missingHeaders && importReport.missingHeaders.length > 0 && (
                <p className="font-body text-xs text-red-400 mt-1">
                  Missing required column(s): {importReport.missingHeaders.join(", ")}
                </p>
              )}
            </div>
            <button onClick={() => setImportReport(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
          </div>
          {importReport.errors.length > 0 && (
            <div className="max-h-48 overflow-y-auto mt-2 border-t border-border pt-2 space-y-1">
              {importReport.errors.map((e, i) => (
                <p key={i} className="font-body text-xs text-muted-foreground">
                  <span className="text-red-400">Row {e.row}:</span> {e.reason}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Low stock alert */}
      {lowStockProducts.length > 0 && (
        <div className="mb-6 p-3 rounded-lg bg-amber-900/20 border border-amber-800/30 flex items-center gap-3">
          <AlertTriangle size={16} className="text-amber-400 shrink-0" />
          <p className="font-body text-sm text-amber-400">
            {lowStockProducts.length} product(s) running low on stock
          </p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="border border-border rounded-lg p-5 bg-card mb-6">
          <h3 className="font-body text-sm font-medium mb-4">
            {editing ? "Edit Product" : "New Product"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className={labelClass}>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} className={inputClass} />
            </div>
            <div>
              <Label className={labelClass}>Slug</Label>
              <div className="flex gap-2 mt-1">
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={`${inputClass} flex-1`} />
                <Button type="button" variant="outline" size="sm" onClick={() => setForm((prev) => ({ ...prev, slug: slugify(prev.name) }))} className="border-border text-muted-foreground font-body text-xs gap-1 shrink-0" title="Regenerate from name">
                  <Wand2 size={12} /> Auto
                </Button>
              </div>
            </div>
            <div>
              <Label className={labelClass}>SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. TDEV-001" className={inputClass} />
            </div>
            <div>
              <Label className={labelClass}>Brand</Label>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. TDEV" className={inputClass} />
            </div>
            <div>
              <Label className={labelClass}>Material</Label>
              <Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="e.g. Cotton, Leather" className={inputClass} />
            </div>
            <div>
              <Label className={labelClass}>Weight (kg)</Label>
              <Input type="number" step="0.01" value={form.weight ?? ""} onChange={(e) => setForm({ ...form, weight: e.target.value ? parseFloat(e.target.value) : null })} placeholder="0.5" className={inputClass} />
            </div>
            <div>
              <Label className={labelClass}>Category</Label>
              <select value={form.category_id || ""} onChange={(e) => setForm({ ...form, category_id: e.target.value || null })} className={`${inputClass} w-full rounded-md px-3 py-2 outline-none`}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label className={labelClass}>Price ($)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className={inputClass} />
            </div>
            <div>
              <Label className={labelClass}>Compare at Price</Label>
              <Input type="number" value={form.compare_at_price ?? ""} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value ? parseFloat(e.target.value) : null })} placeholder="Original price" className={inputClass} />
            </div>
            <div>
              <Label className={labelClass}>Stock Quantity</Label>
              <Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })} className={inputClass} />
            </div>
            <div className="flex items-end gap-6 pb-1">
              <label className="flex items-center gap-2 font-body text-xs text-foreground/70 cursor-pointer">
                <input type="checkbox" checked={form.in_stock} onChange={(e) => setForm({ ...form, in_stock: e.target.checked })} /> In Stock
              </label>
              <label className="flex items-center gap-2 font-body text-xs text-foreground/70 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured
              </label>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <Label className={labelClass}>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} min-h-[80px]`} />
            </div>

            {/* Images */}
            <div className="md:col-span-2 lg:col-span-3">
              <Label className={labelClass}>Images</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                <Input value={imageInput} onChange={(e) => setImageInput(e.target.value)} placeholder="Paste image URL and press Add" className={`${inputClass} flex-1 min-w-[200px]`} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("images", imageInput, setImageInput))} />
                <Button type="button" variant="outline" onClick={() => addToArray("images", imageInput, setImageInput)} className="border-border text-muted-foreground font-body text-xs shrink-0">Add URL</Button>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageFiles(e.target.files)} />
                  <Button asChild type="button" variant="outline" className="border-border text-muted-foreground font-body text-xs shrink-0 gap-1.5">
                    <span><ImageIcon size={14} /> Upload Images</span>
                  </Button>
                </label>
              </div>
              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded overflow-hidden border border-border group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeFromArray("images", i)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Trash2 size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sizes */}
            <div>
              <Label className={labelClass}>Sizes</Label>
              <div className="flex gap-2 mt-1">
                <Input value={sizeInput} onChange={(e) => setSizeInput(e.target.value)} placeholder="e.g. M, L, XL" className={inputClass} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("sizes", sizeInput, setSizeInput))} />
                <Button type="button" variant="outline" onClick={() => addToArray("sizes", sizeInput, setSizeInput)} className="border-border text-muted-foreground font-body text-xs shrink-0">Add</Button>
              </div>
              {form.sizes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.sizes.map((s, i) => (
                    <span key={i} className="font-body text-xs bg-secondary text-foreground/70 px-2 py-1 rounded flex items-center gap-1">
                      {s} <button onClick={() => removeFromArray("sizes", i)} className="text-foreground/30 hover:text-destructive">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Colors */}
            <div>
              <Label className={labelClass}>Colors</Label>
              <div className="flex gap-2 mt-1">
                <Input value={colorInput} onChange={(e) => setColorInput(e.target.value)} placeholder="e.g. Black, Navy" className={inputClass} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("colors", colorInput, setColorInput))} />
                <Button type="button" variant="outline" onClick={() => addToArray("colors", colorInput, setColorInput)} className="border-border text-muted-foreground font-body text-xs shrink-0">Add</Button>
              </div>
              {form.colors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.colors.map((c, i) => (
                    <span key={i} className="font-body text-xs bg-secondary text-foreground/70 px-2 py-1 rounded flex items-center gap-1">
                      {c} <button onClick={() => removeFromArray("colors", i)} className="text-foreground/30 hover:text-destructive">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <Label className={labelClass}>Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="e.g. summer, new-arrival" className={inputClass} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("tags", tagInput, setTagInput))} />
                <Button type="button" variant="outline" onClick={() => addToArray("tags", tagInput, setTagInput)} className="border-border text-muted-foreground font-body text-xs shrink-0">Add</Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map((t, i) => (
                    <span key={i} className="font-body text-xs bg-accent/20 text-accent px-2 py-1 rounded flex items-center gap-1">
                      {t} <button onClick={() => removeFromArray("tags", i)} className="text-accent/40 hover:text-destructive">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={save} className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-xs tracking-wider">
              {editing ? "Update" : "Create"}
            </Button>
            <Button variant="outline" onClick={resetForm} className="border-border text-muted-foreground font-body text-xs">Cancel</Button>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3 p-3 border border-border rounded-lg bg-card">
        <div className="flex-1 min-w-[200px]">
          <Label className={labelClass}>Search</Label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className={inputClass}
          />
        </div>
        <div className="min-w-[180px]">
          <Label className={labelClass}>Category</Label>
          <select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            className={`${inputClass} w-full rounded-md px-3 py-2 outline-none`}
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="min-w-[160px]">
          <Label className={labelClass}>Stock Status</Label>
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value as "all" | "in" | "out")}
            className={`${inputClass} w-full rounded-md px-3 py-2 outline-none`}
          >
            <option value="all">All</option>
            <option value="in">In Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
        {(search || filterCategoryId || filterStock !== "all") && (
          <Button variant="outline" onClick={() => { setSearch(""); setFilterCategoryId(""); setFilterStock("all"); }} className="border-border text-muted-foreground font-body text-xs">
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      {(() => {
        const q = search.trim().toLowerCase();
        const filteredProducts = products.filter((p) => {
          if (q) {
            const hay = `${p.name} ${p.sku || ""}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          if (filterCategoryId && p.category_id !== filterCategoryId) return false;
          if (filterStock === "in" && !((p.stock_quantity ?? 0) > 0)) return false;
          if (filterStock === "out" && (p.stock_quantity ?? 0) > 0) return false;
          return true;
        });
        return (
      <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="text-left px-5 py-3 font-body text-xs tracking-wider uppercase text-muted-foreground">Product</th>
              <th className="text-left px-5 py-3 font-body text-xs tracking-wider uppercase text-muted-foreground">SKU</th>
              <th className="text-left px-5 py-3 font-body text-xs tracking-wider uppercase text-muted-foreground">Brand</th>
              <th className="text-left px-5 py-3 font-body text-xs tracking-wider uppercase text-muted-foreground">Category</th>
              <th className="text-left px-5 py-3 font-body text-xs tracking-wider uppercase text-muted-foreground">Price</th>
              <th className="text-left px-5 py-3 font-body text-xs tracking-wider uppercase text-muted-foreground">Stock</th>
              <th className="text-left px-5 py-3 font-body text-xs tracking-wider uppercase text-muted-foreground">Status</th>
              <th className="text-right px-5 py-3 font-body text-xs tracking-wider uppercase text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center">
                  <Package size={32} className="mx-auto mb-3 text-muted-foreground/30" />
                  <p className="font-body text-sm text-muted-foreground/50">{products.length === 0 ? "No products yet" : "No products match your filters"}</p>
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const pAny = p as any;
                const isLowStock = p.stock_quantity > 0 && p.stock_quantity <= 5;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {p.images && p.images[0] && (
                          <img src={p.images[0]} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                        )}
                        <div>
                          <p className="font-body text-sm">{p.name}</p>
                          <p className="font-body text-xs text-muted-foreground">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-body text-xs text-muted-foreground font-mono">{p.sku || "—"}</td>
                    <td className="px-5 py-3 font-body text-xs text-muted-foreground">{pAny.brand || "—"}</td>
                    <td className="px-5 py-3 font-body text-xs text-muted-foreground">{getCategoryName(p.category_id)}</td>
                    <td className="px-5 py-3 font-body text-sm">${p.price.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={`font-body text-xs px-2 py-1 rounded ${
                        p.stock_quantity === 0 ? "bg-red-900/30 text-red-400" : isLowStock ? "bg-amber-900/30 text-amber-400" : "bg-green-900/30 text-green-400"
                      }`}>
                        {p.stock_quantity} units
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`font-body text-xs px-2 py-1 rounded ${p.in_stock ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                        {p.in_stock ? "In Stock" : "Out of Stock"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => startEdit(p)} title="Edit" className="text-muted-foreground hover:text-accent mr-3"><Pencil size={14} /></button>
                      <button onClick={() => duplicate(p)} title="Duplicate" className="text-muted-foreground hover:text-accent mr-3"><Copy size={14} /></button>
                      <button onClick={() => remove(p.id)} title="Delete" className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
        );
      })()}
    </div>
  );
};

export default AdminProducts;
