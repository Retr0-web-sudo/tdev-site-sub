import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import type { ShopifyProduct } from "@/lib/shopify";

interface ShopifyProductCardProps {
  product: ShopifyProduct;
}

const ShopifyProductCard = ({ product }: ShopifyProductCardProps) => {
  const { node } = product;
  const mainImage = node.images?.edges?.[0]?.node;
  const price = node.priceRange.minVariantPrice;
  const firstVariant = node.variants.edges[0]?.node;
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant) return;
    await addItem({
      product,
      variantId: firstVariant.id,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
      quantity: 1,
      selectedOptions: firstVariant.selectedOptions || [],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Link to={`/product/${node.handle}`} className="group block">
        <div className="aspect-[3/4] bg-secondary overflow-hidden mb-4 relative">
          {mainImage ? (
            <img
              src={mainImage.url}
              alt={mainImage.altText || node.title}
              className="w-full h-full object-cover transition-transform duration-[1s] ease-out group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="font-display text-5xl text-muted-foreground/15">
                {node.title[0]}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

          {/* Quick add button */}
          <button
            onClick={handleAddToCart}
            disabled={isLoading || !firstVariant?.availableForSale}
            className="absolute bottom-3 left-3 right-3 py-2.5 bg-background/90 backdrop-blur-sm text-foreground text-xs font-body tracking-[0.15em] uppercase opacity-0 group-hover:opacity-100 transition-all duration-400 translate-y-2 group-hover:translate-y-0 hover:bg-foreground hover:text-primary-foreground disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Quick Add"}
          </button>

          <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-400 translate-y-2 group-hover:translate-y-0">
            <ArrowUpRight size={15} className="text-foreground" />
          </div>

          {!firstVariant?.availableForSale && (
            <div className="absolute top-3 left-3">
              <span className="bg-foreground text-primary-foreground text-[9px] font-body font-semibold tracking-wider uppercase px-2.5 py-1">
                Sold Out
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="font-display text-base font-normal text-foreground group-hover:text-accent transition-colors duration-300 leading-snug">
            {node.title}
          </h3>
          <span className="font-body text-sm text-muted-foreground">
            {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

export default ShopifyProductCard;
