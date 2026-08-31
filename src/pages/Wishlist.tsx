import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/hooks/useWishlist";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Seo from "@/components/Seo";

const Wishlist = () => {
  const { items, clearWishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Your Wishlist — TDEV" description="Items you've saved from the TDEV collections." path="/wishlist" noindex />
      <Navbar />
      <main className="pt-28 pb-20 section-padding">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-foreground">
              Wishlist
            </h1>
            <p className="font-body text-sm text-muted-foreground mt-1">
              {items.length} {items.length === 1 ? "item" : "items"} saved
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearWishlist}
              className="font-body text-xs tracking-wider uppercase text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Heart size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-display text-xl text-muted-foreground mb-2">
              Your wishlist is empty
            </p>
            <p className="font-body text-sm text-muted-foreground/70 mb-6">
              Browse our collections and save items you love.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 border border-border text-foreground px-8 py-3 text-[10px] tracking-[0.3em] uppercase font-body hover:border-accent hover:text-accent transition-all duration-300"
            >
              Explore Collections
            </Link>
          </motion.div>
        ) : (
          <>
            <h2 className="sr-only">Saved items</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Wishlist;
