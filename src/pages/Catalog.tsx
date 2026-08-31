import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Filter, Check, X, Search, Grid3X3, List, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import SubscriptionNav from "@/components/SubscriptionNav";
import { supabase } from "@/integrations/supabase/client";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  category_id: string;
  category_name?: string;
  sizes: string[];
  colors: string[];
  images: string[];
  tier: string;
  description: string;
  material: string;
  brand: string;
  tags: string[];
  in_stock: boolean;
  featured: boolean;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  essentials: { label: "Essentials", color: "bg-secondary text-muted-foreground border border-border" },
  premium: { label: "Premium", color: "bg-accent/15 text-accent border border-accent/30" },
  luxe: { label: "Luxe", color: "bg-amber-500/15 text-amber-400 border border-amber-500/30" },
};

const TIER_ORDER = ["essentials", "premium", "luxe"];

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("cat") || "all");
  const [selectedTier, setSelectedTier] = useState(searchParams.get("tier") || "all");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [prodRes, catRes] = await Promise.all([
        supabase.from("products").select("*").eq("in_stock", true).eq("status", "published"),
        supabase.from("categories").select("*"),
      ]);
      if (prodRes.data) setProducts(prodRes.data as Product[]);
      if (catRes.data) setCategories(catRes.data as Category[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const allSizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const allColors = [...new Set(products.flatMap(p => p.colors || []))].filter(Boolean).sort();

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.description || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategory !== "all" && p.category_id !== selectedCategory) return false;
    if (selectedTier !== "all" && p.tier !== selectedTier) return false;
    if (selectedSizes.length > 0 && !(p.sizes || []).some(s => selectedSizes.includes(s))) return false;
    if (selectedColors.length > 0 && !(p.colors || []).some(c => selectedColors.includes(c))) return false;
    return true;
  });

  const toggleArray = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Browse Catalog — TDEV Closet" description="Explore our curated collection. Pick outfits for your monthly subscription box." path="/catalog" />
      <Navbar />

      <main className="section-padding pt-24 md:pt-28 pb-16 sm:pb-20">
        <div className="flex justify-center mb-8">
          <SubscriptionNav />
        </div>

        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground font-body mb-3">Subscription Catalog</p>
          <h1 className="font-display text-4xl sm:text-5xl font-light text-foreground">
            Browse & <span className="italic text-accent">Pick Your Box</span>
          </h1>
          <p className="mt-3 text-muted-foreground font-body text-sm max-w-lg mx-auto">
            Explore pieces by tier. Pick what you love, and we'll curate the rest based on your style.
          </p>
        </motion.div>

        {/* Search + Filter Bar */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pieces..." className="w-full bg-card/50 border border-border/40 rounded-lg pl-10 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-body tracking-wider transition-colors ${showFilters ? "bg-accent text-accent-foreground" : "bg-card/50 border border-border/40 text-muted-foreground hover:text-foreground"}`}>
                <Filter size={14} /> Filters
              </button>
              <div className="flex bg-card/50 border border-border/40 rounded-lg overflow-hidden">
                <button onClick={() => setViewMode("grid")} className={`p-2.5 ${viewMode === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}><Grid3X3 size={14} /></button>
                <button onClick={() => setViewMode("list")} className={`p-2.5 ${viewMode === "list" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}><List size={14} /></button>
              </div>
            </div>
          </div>

          {/* Tier tabs */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setSelectedTier("all"); setSearchParams({ tier: "all" }); }} className={`px-4 py-2 rounded-full text-[11px] font-body tracking-wider transition-colors ${selectedTier === "all" ? "bg-accent text-accent-foreground" : "bg-card/50 border border-border/40 text-muted-foreground hover:text-foreground"}`}>
              All Tiers
            </button>
            {TIER_ORDER.map(t => (
              <button key={t} onClick={() => { setSelectedTier(t); setSearchParams({ tier: t }); }} className={`px-4 py-2 rounded-full text-[11px] font-body tracking-wider capitalize transition-colors ${selectedTier === t ? "bg-accent text-accent-foreground" : "bg-card/50 border border-border/40 text-muted-foreground hover:text-foreground"}`}>
                {t}
              </button>
            ))}
            {selectedCategory !== "all" && categories.find(c => c.id === selectedCategory) && (
              <span className="px-4 py-2 rounded-full text-[11px] font-body tracking-wider bg-accent/15 text-accent border border-accent/30 flex items-center gap-1.5">
                {categories.find(c => c.id === selectedCategory)?.name}
                <button onClick={() => { setSelectedCategory("all"); setSearchParams({}); }}><X size={12} /></button>
              </span>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div className="max-w-6xl mx-auto mb-6 bg-card/50 border border-border/40 rounded-xl p-5" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body mb-2">Category</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setSelectedCategory("all")} className={`px-3 py-1.5 rounded text-[10px] font-body ${selectedCategory === "all" ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>All</button>
                    {categories.map(c => (
                      <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`px-3 py-1.5 rounded text-[10px] font-body ${selectedCategory === c.id ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>{c.name}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body mb-2">Sizes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allSizes.map(s => (
                      <button key={s} onClick={() => setSelectedSizes(prev => toggleArray(prev, s))} className={`px-3 py-1.5 rounded text-[10px] font-body ${selectedSizes.includes(s) ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body mb-2">Colors</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allColors.slice(0, 12).map(c => (
                      <button key={c} onClick={() => setSelectedColors(prev => toggleArray(prev, c))} className={`px-3 py-1.5 rounded text-[10px] font-body ${selectedColors.includes(c) ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>{c}</button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        <p className="max-w-6xl mx-auto text-xs font-body text-muted-foreground mb-4">{filtered.length} pieces found</p>

        {/* Product Grid */}
        {loading ? (
          <p className="text-muted-foreground text-sm text-center py-16">Loading catalog...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-body text-sm">No pieces match your filters.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filtered.map((product, i) => {
              const tierInfo = TIER_LABELS[product.tier] || TIER_LABELS.essentials;
              return (
                <motion.div key={product.id} className="group bg-card/50 border border-border/40 rounded-xl overflow-hidden hover:border-accent/30 transition-all" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.5) }}>
                  <div className="aspect-[3/4] bg-secondary/30 relative overflow-hidden">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 font-display text-3xl">{product.name[0]}</div>
                    )}
                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-body tracking-wider uppercase ${tierInfo.color}`}>{tierInfo.label}</span>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider mb-0.5">{product.brand || "TDEV"}</p>
                    <h3 className="text-sm font-body font-medium text-foreground truncate">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-body font-medium text-foreground">GH¢ {Number(product.price)}</span>
                      {product.sizes?.length > 0 && (
                        <span className="text-[10px] text-muted-foreground font-body">{product.sizes.length} sizes</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-2">
            {filtered.map((product, i) => {
              const tierInfo = TIER_LABELS[product.tier] || TIER_LABELS.essentials;
              return (
                <motion.div key={product.id} className="group flex items-center gap-4 bg-card/50 border border-border/40 rounded-xl p-3 hover:border-accent/30 transition-all" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}>
                  <div className="w-16 h-20 bg-secondary/30 rounded-lg overflow-hidden flex-shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 font-display text-xl">{product.name[0]}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-body tracking-wider uppercase ${tierInfo.color}`}>{tierInfo.label}</span>
                      <span className="text-[10px] text-muted-foreground font-body">{product.category_name || "Uncategorized"}</span>
                    </div>
                    <h3 className="text-sm font-body font-medium text-foreground truncate">{product.name}</h3>
                    <p className="text-xs text-muted-foreground font-body truncate">{product.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-body font-medium text-foreground">GH¢ {Number(product.price)}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{product.sizes?.join(", ")}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <motion.div className="text-center mt-12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <Link to="/subscription/plans" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-accent text-accent-foreground text-[11px] tracking-[0.15em] uppercase font-body font-medium hover:bg-accent/90 transition-all">
            Pick Your Plan <ArrowRight size={14} />
          </Link>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Catalog;
