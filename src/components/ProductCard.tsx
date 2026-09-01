import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Heart, Lock } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useWishlist } from "@/hooks/useWishlist";

const TIER_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  essentials: { label: "Essentials", bg: "bg-secondary/80", text: "text-muted-foreground" },
  premium: { label: "Premium", bg: "bg-accent/15", text: "text-accent" },
  luxe: { label: "Luxe", bg: "bg-amber-500/15", text: "text-amber-400" },
};

interface ProductCardProps {
  product: Tables<"products">;
}

const ProductCard = ({ product }: ProductCardProps) => {
  if (!product) return null;
  const mainImage = product.images?.[0];
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const { isInWishlist, toggleWishlist } = useWishlist();
  const wishlisted = isInWishlist(product.id);
  const tier = (product as any).tier || "essentials";
  const tierStyle = TIER_STYLES[tier] || TIER_STYLES.essentials;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Link to={`/product/${product.slug}`} className="group block">
        {/* Image container */}
        <div className="aspect-[3/4] bg-secondary overflow-hidden mb-4 relative">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-[1s] ease-out group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="font-display text-5xl text-muted-foreground/15">
                {product.name[0]}
              </span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

          {/* Wishlist button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-background hover:scale-110 z-10"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              size={15}
              className={`transition-colors duration-300 ${
                wishlisted ? "fill-red-400 text-red-400" : "text-foreground"
              }`}
            />
          </button>

          {/* Quick view button */}
          <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-400 translate-y-2 group-hover:translate-y-0">
            <ArrowUpRight size={15} className="text-foreground" />
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {/* Tier badge */}
            <span className={`${tierStyle.bg} ${tierStyle.text} text-[9px] font-body font-semibold tracking-wider uppercase px-2.5 py-1 backdrop-blur-sm`}>
              {tier === "luxe" && <Lock size={8} className="inline mr-1" />}
              {tierStyle.label}
            </span>
            {hasDiscount && (
              <span className="bg-accent text-accent-foreground text-[9px] font-body font-semibold tracking-wider uppercase px-2.5 py-1">
                Sale
              </span>
            )}
            {(product.stock_quantity ?? 0) > 0 ? (
              <span className="bg-green-600 text-white text-[9px] font-body font-semibold tracking-wider uppercase px-2.5 py-1">
                In Stock
              </span>
            ) : (
              <span className="bg-red-600 text-white text-[9px] font-body font-semibold tracking-wider uppercase px-2.5 py-1">
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1">
          <h3 className="font-display text-base font-normal text-foreground group-hover:text-accent transition-colors duration-300 leading-snug">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2.5">
            <span className={`font-body text-sm ${hasDiscount ? "text-accent font-medium" : "text-muted-foreground"}`}>
              GH¢ {Number(product.price).toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="font-body text-xs text-muted-foreground/60 line-through">
                GH¢ {Number(product.compare_at_price).toFixed(2)}
              </span>
            )}
          </div>
          {product.colors && product.colors.length > 0 && (
            <div className="flex gap-1.5 pt-1">
              {product.colors.slice(0, 4).map((color) => (
                <div
                  key={color}
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[9px] text-muted-foreground font-body self-center">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
