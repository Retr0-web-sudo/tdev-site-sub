import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import SubscriptionNav from "@/components/SubscriptionNav";
import { supabase } from "@/integrations/supabase/client";
import tdevFemmeHero from "@/assets/tdev-femme-hero.jpg";
import tdevHommeHero from "@/assets/tdev-homme-hero.jpg";
import tdevCottonBoll from "@/assets/tdev-cotton-boll.jpg";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number | null;
};

const fallbackImages: Record<string, string> = {
  femme: tdevFemmeHero,
  homme: tdevHommeHero,
  global: tdevCottonBoll,
};

const Catalog = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [{ data: cats, error: catErr }, { data: prods, error: prodErr, count }] = await Promise.all([
      supabase.from("categories").select("*").order("display_order", { ascending: true }),
      supabase.from("products").select("category_id", { count: "exact" }),
    ]);

    if (catErr) console.log("[Shop] categories error:", catErr);
    if (prodErr) console.log("[Shop] products error:", prodErr);

    const tally: Record<string, number> = {};
    (prods ?? []).forEach((p: any) => {
      if (p.category_id) tally[p.category_id] = (tally[p.category_id] ?? 0) + 1;
    });
    setCounts(tally);
    setTotalProducts(count ?? (prods?.length ?? 0));
    setCategories(cats ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);

    const channel = supabase
      .channel("shop-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchData)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Browse Collections — TDEV Closet" description="Explore our curated collections. Pick outfits for your monthly subscription box." path="/shop" />
      <Navbar />

      <main className="section-padding pt-24 md:pt-28 pb-16 sm:pb-20">
        <div className="flex justify-center mb-8">
          <SubscriptionNav />
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm tracking-wider mb-8"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <motion.div
          className="mb-8 sm:mb-12 flex items-end justify-between gap-4 flex-wrap"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div>
            <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground font-body mb-2 sm:mb-3">
              Browse
            </p>
            <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-light text-foreground leading-[1.1]">
              Collections
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground font-body mb-1">
              Total products
            </p>
            <p className="font-display text-2xl md:text-3xl font-light text-foreground">
              {totalProducts}
            </p>
          </div>
        </motion.div>

        <h2 className="sr-only">Browse our collections</h2>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading collections…</p>
        ) : categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">No collections yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {categories.map((item, i) => {
              const img = item.image_url || fallbackImages[item.slug?.toLowerCase()] || tdevCottonBoll;
              const productCount = counts[item.id] ?? 0;
              return (
                <motion.div
                  key={item.id}
                  className="group relative block"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                >
                  <Link to={`/category/${item.slug}`} className="block w-full h-full overflow-hidden">
                    <div className="relative w-full aspect-[3/4]">
                      <img
                        src={img}
                        alt={item.description || `${item.name} collection`}
                        className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />

                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] tracking-[0.3em] uppercase text-white/60 font-body mb-1.5">
                            {productCount} {productCount === 1 ? "product" : "products"}
                          </p>
                          <h3 className="font-display text-2xl md:text-3xl font-light text-white">
                            {item.name}
                          </h3>
                        </div>
                        <div className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-0 translate-x-2">
                          <ArrowUpRight size={16} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Catalog;
