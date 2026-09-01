import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Package, Loader2, ShoppingBag, X, Sparkles, Star, Crown, MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type Plan = {
  id: string;
  name: string;
  slug: string;
  price: number;
  item_count_min: number;
  item_count_max: number;
  features: string[];
};

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  sizes: string[];
  colors: string[];
  tier: string;
  category_name?: string;
  brand: string;
};

const TIER_ACCESS: Record<string, string[]> = {
  essentials: ["essentials"],
  premium: ["essentials", "premium"],
  luxe: ["essentials", "premium", "luxe"],
};

const planIcons: Record<string, typeof Sparkles> = {
  essentials: Sparkles,
  premium: Star,
  luxe: Crown,
};

const BOX_THEMES = [
  { id: "workwear", label: "Workwear", icon: "💼", desc: "Polished pieces for the office and beyond" },
  { id: "casual", label: "Casual Everyday", icon: "☕", desc: "Relaxed fits for daily comfort" },
  { id: "date-night", label: "Date Night", icon: "🕯", desc: "Standout looks for special evenings" },
  { id: "streetwear", label: "Streetwear", icon: "🔥", desc: "Bold, urban, trend-forward" },
  { id: "vacation", label: "Vacation", icon: "✈", desc: "Pack-ready pieces for your next trip" },
  { id: "surprise", label: "Stylist's Pick", icon: "✨", desc: "Let our curators surprise you" },
];

const BoxBuilder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const planId = searchParams.get("plan");

  const [plan, setPlan] = useState<Plan | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"theme" | "pick" | "review">("theme");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [stylistNotes, setStylistNotes] = useState("");

  useEffect(() => {
    if (!planId) { navigate("/subscription/plans"); return; }
    const fetchData = async () => {
      const [planRes, prodRes] = await Promise.all([
        supabase.from("subscription_plans").select("*").eq("id", planId).single(),
        supabase.from("products").select("*").eq("in_stock", true).eq("status", "published"),
      ]);
      if (planRes.data) setPlan(planRes.data as Plan);
      if (prodRes.data) {
        const accessible = TIER_ACCESS[(planRes.data as Plan)?.slug] || ["essentials"];
        setProducts((prodRes.data as Product[]).filter(p => accessible.includes(p.tier)));
      }
      setLoading(false);
    };
    fetchData();
  }, [planId, navigate]);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (plan && prev.length >= (plan.item_count_max || 5)) {
        toast({ title: "Box is full", description: `Your plan allows up to ${plan.item_count_max} items. Remove one first.`, variant: "destructive" });
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleConfirm = async () => {
    if (!plan || !user) return;
    setSubmitting(true);
    try {
      const selectedProducts = products.filter(p => selectedItems.includes(p.id));
      const boxData = {
        planId: plan.id,
        theme: selectedTheme || "surprise",
        items: selectedProducts.map(p => ({ id: p.id, name: p.name, price: p.price, tier: p.tier })),
        itemCount: selectedProducts.length,
        stylistNotes: stylistNotes || null,
      };
      sessionStorage.setItem("tdev_box", JSON.stringify(boxData));
      navigate(`/subscription/checkout?plan=${plan.id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="section-padding pt-24 flex items-center justify-center">
          <Loader2 className="animate-spin text-accent" size={24} />
        </main>
      </div>
    );
  }

  if (!plan) return null;

  const selectedProducts = products.filter(p => selectedItems.includes(p.id));
  const totalValue = selectedProducts.reduce((sum, p) => sum + Number(p.price), 0);
  const Icon = planIcons[plan.slug] || Sparkles;

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Build Your Box — TDEV" description="Pick the outfits you want in your monthly subscription box." path="/subscription/build-box" />
      <Navbar />

      <main className="section-padding pt-24 md:pt-28 pb-16 sm:pb-20">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm tracking-wider mb-6">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Icon size={18} className="text-accent" />
              <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-body">{plan.name} Box</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-light text-foreground">
              {step === "theme" ? "What's the Occasion?" : step === "pick" ? "Build Your Monthly Box" : "Review Your Box"}
            </h1>
            <p className="mt-2 text-muted-foreground font-body text-sm">
              {step === "theme"
                ? "Choose a theme for this month's box, or let our stylists surprise you."
                : step === "pick"
                ? `Pick ${plan.item_count_min}–${plan.item_count_max} items. We'll curate the rest based on your style quiz.`
                : "Confirm your selections and add any notes for your stylist."}
            </p>
          </motion.div>

          {/* Step Indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {(["theme", "pick", "review"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-body font-medium border transition-all ${
                  step === s ? "bg-accent text-accent-foreground border-accent" : i < ["theme", "pick", "review"].indexOf(step) ? "bg-accent/20 text-accent border-accent/40" : "bg-card/50 text-muted-foreground border-border/40"
                }`}>
                  {i < ["theme", "pick", "review"].indexOf(step) ? <Check size={12} /> : i + 1}
                </div>
                {i < 2 && <div className={`w-8 h-px ${i < ["theme", "pick", "review"].indexOf(step) ? "bg-accent/40" : "bg-border/40"}`} />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {/* Step 1: Theme Selection */}
                {step === "theme" && (
                  <motion.div
                    key="theme"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                  >
                    {BOX_THEMES.map((theme) => {
                      const isSelected = selectedTheme === theme.id;
                      return (
                        <motion.button
                          key={theme.id}
                          onClick={() => setSelectedTheme(theme.id)}
                          className={`text-left p-4 rounded-xl border transition-all ${
                            isSelected ? "border-accent bg-accent/10 ring-1 ring-accent/30" : "border-border/40 hover:border-accent/30 bg-card/30"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="text-2xl mb-2 block">{theme.icon}</span>
                          <h3 className="font-body text-sm font-medium text-foreground">{theme.label}</h3>
                          <p className="font-body text-xs text-muted-foreground mt-1">{theme.desc}</p>
                          {isSelected && (
                            <div className="mt-2">
                              <Check size={14} className="text-accent" />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}

                {/* Step 2: Pick Items */}
                {step === "pick" && (
                  <motion.div
                    key="pick"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                  >
                    {products.map((product) => {
                      const isSelected = selectedItems.includes(product.id);
                      return (
                        <motion.button
                          key={product.id}
                          onClick={() => toggleItem(product.id)}
                          className={`group text-left bg-card/50 border rounded-xl overflow-hidden transition-all ${
                            isSelected ? "border-accent ring-1 ring-accent/30" : "border-border/40 hover:border-accent/30"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="aspect-[3/4] bg-secondary/30 relative overflow-hidden">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 font-display text-2xl">{product.name[0]}</div>
                            )}
                            {isSelected && (
                              <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                                  <Check size={16} className="text-accent-foreground" />
                                </div>
                              </div>
                            )}
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-body tracking-wider uppercase bg-background/80 text-foreground backdrop-blur-sm capitalize">
                              {product.tier}
                            </span>
                          </div>
                          <div className="p-3">
                            <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">{product.brand || "TDEV"}</p>
                            <h3 className="text-sm font-body font-medium text-foreground truncate">{product.name}</h3>
                            <p className="text-sm font-body text-foreground/70 mt-0.5">GH¢ {Number(product.price)}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}

                {/* Step 3: Review */}
                {step === "review" && (
                  <motion.div
                    key="review"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {/* Selected Items */}
                    <div className="space-y-2">
                      {selectedProducts.map((p) => (
                        <div key={p.id} className="flex items-center gap-4 bg-card/50 border border-border/40 rounded-xl p-3">
                          <div className="w-14 h-18 bg-secondary/30 rounded-lg overflow-hidden flex-shrink-0">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 font-display text-lg">{p.name[0]}</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-body font-medium text-foreground truncate">{p.name}</h3>
                            <p className="text-xs text-muted-foreground font-body">{p.brand || "TDEV"} · {p.sizes?.join(", ")}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-body text-foreground">GH¢ {Number(p.price)}</span>
                            <button onClick={() => toggleItem(p.id)} className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-md transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Stylist Notes */}
                    <div className="bg-card/50 border border-border/40 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare size={14} className="text-accent" />
                        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body">Notes for your stylist</span>
                      </div>
                      <textarea
                        value={stylistNotes}
                        onChange={(e) => setStylistNotes(e.target.value)}
                        placeholder="e.g. I need work-appropriate pieces, prefer earth tones, avoid anything too tight..."
                        className="w-full h-24 bg-secondary/30 border border-border/30 rounded-lg px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors resize-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card/50 border border-border/40 rounded-xl p-5 sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBag size={16} className="text-accent" />
                  <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-body">Your Box</p>
                </div>

                <div className="border-b border-border/30 pb-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-body text-foreground">{plan.name}</span>
                    <span className="text-sm font-body text-muted-foreground">GH¢ {plan.price}/mo</span>
                  </div>
                  {selectedTheme && (
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      {BOX_THEMES.find(t => t.id === selectedTheme)?.icon} {BOX_THEMES.find(t => t.id === selectedTheme)?.label}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs font-body mb-1">
                    <span className="text-muted-foreground">Items picked</span>
                    <span className="text-foreground">{selectedItems.length} / {plan.item_count_max}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-accent rounded-full"
                      animate={{ width: `${(selectedItems.length / (plan.item_count_max || 5)) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-body mt-1">
                    {selectedItems.length < (plan.item_count_min || 2)
                      ? `Pick at least ${plan.item_count_min || 2} items`
                      : "Ready to confirm!"}
                  </p>
                </div>

                {selectedProducts.length > 0 && (
                  <div className="space-y-1.5 mb-4">
                    {selectedProducts.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between text-xs font-body">
                        <span className="text-foreground/70 truncate flex-1">{p.name}</span>
                        <span className="text-muted-foreground ml-2">GH¢ {Number(p.price)}</span>
                      </div>
                    ))}
                    {selectedProducts.length > 5 && (
                      <p className="text-[10px] text-muted-foreground font-body">+{selectedProducts.length - 5} more</p>
                    )}
                    <div className="border-t border-border/30 pt-2 mt-2 flex justify-between text-xs font-body">
                      <span className="text-muted-foreground">Total value</span>
                      <span className="text-foreground font-medium">GH¢ {totalValue.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                {step === "theme" ? (
                  <button
                    onClick={() => setStep("pick")}
                    disabled={!selectedTheme}
                    className="w-full py-3 rounded-full bg-accent text-accent-foreground text-[11px] tracking-[0.15em] uppercase font-body font-medium hover:bg-accent/90 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    Pick Items <ArrowRight size={14} />
                  </button>
                ) : step === "pick" ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => setStep("theme")}
                      className="w-full py-2.5 rounded-full border border-border/40 text-muted-foreground text-[11px] tracking-[0.15em] uppercase font-body font-medium hover:border-accent/40 transition-all"
                    >
                      Change Theme
                    </button>
                    <button
                      onClick={() => setStep("review")}
                      disabled={selectedItems.length < (plan.item_count_min || 2)}
                      className="w-full py-3 rounded-full bg-accent text-accent-foreground text-[11px] tracking-[0.15em] uppercase font-body font-medium hover:bg-accent/90 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                      Review Box <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => setStep("pick")}
                      className="w-full py-2.5 rounded-full border border-border/40 text-muted-foreground text-[11px] tracking-[0.15em] uppercase font-body font-medium hover:border-accent/40 transition-all"
                    >
                      Edit Selection
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={submitting || selectedItems.length < (plan.item_count_min || 2)}
                      className="w-full py-3 rounded-full bg-accent text-accent-foreground text-[11px] tracking-[0.15em] uppercase font-body font-medium hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : "Proceed to Checkout"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BoxBuilder;
