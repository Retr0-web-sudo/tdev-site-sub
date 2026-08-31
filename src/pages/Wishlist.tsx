import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, ArrowRight, Lock, Sparkles, Star, Crown, ShoppingCart } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import SubscriptionNav from "@/components/SubscriptionNav";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type WishlistItem = {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  tier: string;
  sizes: string[];
  colors: string[];
  brand: string;
  in_stock: boolean;
};

type Subscription = {
  id: string;
  status: string;
  plan_name: string;
  plan_slug: string;
};

const TIER_ACCESS: Record<string, string[]> = {
  essentials: ["essentials"],
  premium: ["essentials", "premium"],
  luxe: ["essentials", "premium", "luxe"],
};

const TIER_HIERARCHY = ["essentials", "premium", "luxe"];

const tierIcons: Record<string, typeof Sparkles> = {
  essentials: Sparkles,
  premium: Star,
  luxe: Crown,
};

const tierColors: Record<string, string> = {
  essentials: "text-muted-foreground",
  premium: "text-accent",
  luxe: "text-amber-400",
};

const Wishlist = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("tdev_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [wishRes, subRes] = await Promise.all([
        fetch("/api/wishlist", { headers }).then(r => r.json()),
        fetch("/api/subscriptions", { headers }).then(r => r.json()),
      ]);

      if (wishRes.success) setItems(wishRes.data);
      if (subRes.success && subRes.data?.[0]) setSubscription(subRes.data[0]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const removeItem = async (productId: string) => {
    const token = localStorage.getItem("tdev_token");
    const res = await fetch(`/api/wishlist/${productId}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();
    if (data.success) {
      setItems(prev => prev.filter(i => i.product_id !== productId));
      toast({ title: "Removed from wishlist" });
    }
  };

  const currentTier = subscription?.plan_slug || "essentials";
  const currentTierIdx = TIER_HIERARCHY.indexOf(currentTier);
  const nextTier = TIER_HIERARCHY[currentTierIdx + 1];

  const lockedItems = items.filter(item => {
    const accessible = TIER_ACCESS[currentTier] || ["essentials"];
    return !accessible.includes(item.tier);
  });

  const unlockedItems = items.filter(item => {
    const accessible = TIER_ACCESS[currentTier] || ["essentials"];
    return accessible.includes(item.tier);
  });

  const formatCedi = (n: number) => `GH¢${Number(n || 0).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Wishlist — TDEV Closet" description="Your saved pieces. Upgrade your tier to unlock more." path="/wishlist" />
      <Navbar />

      <main className="section-padding pt-24 md:pt-28 pb-16 sm:pb-20">
        <div className="flex justify-center mb-8">
          <SubscriptionNav />
        </div>

        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground font-body mb-3">Your Wishlist</p>
          <h1 className="font-display text-3xl sm:text-4xl font-light text-foreground">
            Pieces You <span className="italic text-accent">Love</span>
          </h1>
          <p className="mt-2 text-muted-foreground font-body text-sm">
            {items.length} {items.length === 1 ? "item" : "items"} saved. {lockedItems.length > 0 && `Upgrade to unlock ${lockedItems.length} locked ${lockedItems.length === 1 ? "piece" : "pieces"}.`}
          </p>
        </motion.div>

        {loading ? (
          <p className="text-muted-foreground text-sm text-center">Loading...</p>
        ) : items.length === 0 ? (
          <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Heart size={48} className="mx-auto text-muted-foreground/20 mb-4" />
            <h2 className="font-display text-xl text-foreground mb-2">No saved pieces yet</h2>
            <p className="text-muted-foreground font-body text-sm mb-6">Browse the catalog and save pieces you love.</p>
            <Link to="/catalog" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-foreground text-[11px] tracking-[0.15em] uppercase font-body font-medium hover:bg-accent/90 transition-all">
              Browse Catalog <ArrowRight size={14} />
            </Link>
          </motion.div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Upgrade CTA if locked items */}
            {lockedItems.length > 0 && nextTier && (
              <motion.div className="bg-accent/10 border border-accent/30 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3">
                  <Lock size={18} className="text-accent" />
                  <div>
                    <p className="font-body text-sm text-foreground font-medium">{lockedItems.length} pieces locked to higher tiers</p>
                    <p className="font-body text-xs text-muted-foreground">Upgrade to {nextTier.charAt(0).toUpperCase() + nextTier.slice(1)} to unlock them all.</p>
                  </div>
                </div>
                <Link to="/subscription/plans" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-[10px] tracking-[0.15em] uppercase font-body font-medium hover:bg-accent/90 transition-all">
                  Upgrade Plan <ArrowRight size={12} />
                </Link>
              </motion.div>
            )}

            {/* Unlocked items */}
            {unlockedItems.length > 0 && (
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-body mb-3">Available to Add</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {unlockedItems.map((item, i) => {
                    const Icon = tierIcons[item.tier] || Sparkles;
                    return (
                      <motion.div key={item.id} className="group bg-card/50 border border-border/40 rounded-xl overflow-hidden hover:border-accent/30 transition-all" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <div className="aspect-[3/4] bg-secondary/30 relative overflow-hidden">
                          {item.images?.[0] ? (
                            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 font-display text-2xl">{item.name[0]}</div>
                          )}
                          <button onClick={() => removeItem(item.product_id)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors">
                            <Heart size={12} fill="currentColor" />
                          </button>
                          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-body tracking-wider uppercase bg-background/80 backdrop-blur-sm ${tierColors[item.tier]}`}>
                            {item.tier}
                          </span>
                        </div>
                        <div className="p-3">
                          <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">{item.brand || "TDEV"}</p>
                          <h3 className="text-sm font-body font-medium text-foreground truncate">{item.name}</h3>
                          <p className="text-sm font-body text-foreground/70 mt-0.5">{formatCedi(item.price)}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Locked items */}
            {lockedItems.length > 0 && (
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-body mb-3 flex items-center gap-2">
                  <Lock size={12} /> Locked (Upgrade to Access)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {lockedItems.map((item, i) => {
                    const Icon = tierIcons[item.tier] || Sparkles;
                    return (
                      <motion.div key={item.id} className="group relative bg-card/50 border border-border/40 rounded-xl overflow-hidden opacity-60" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.6, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <div className="aspect-[3/4] bg-secondary/30 relative overflow-hidden">
                          {item.images?.[0] ? (
                            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 font-display text-2xl">{item.name[0]}</div>
                          )}
                          <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                              <Lock size={16} className="text-foreground/60" />
                            </div>
                          </div>
                          <button onClick={() => removeItem(item.product_id)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors">
                            <Heart size={12} fill="currentColor" />
                          </button>
                          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-body tracking-wider uppercase bg-background/80 backdrop-blur-sm ${tierColors[item.tier]}`}>
                            <Lock size={8} className="inline mr-1" />{item.tier}
                          </span>
                        </div>
                        <div className="p-3">
                          <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">{item.brand || "TDEV"}</p>
                          <h3 className="text-sm font-body font-medium text-foreground truncate">{item.name}</h3>
                          <p className="text-sm font-body text-foreground/70 mt-0.5">{formatCedi(item.price)}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
