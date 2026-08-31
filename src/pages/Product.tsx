import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Heart, Minus, Plus, Check, Truck, Shield, RotateCcw } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";
import Seo from "@/components/Seo";

const Product = () => {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("slug", slug!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", product?.category_id, product?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", product!.category_id!)
        .neq("id", product!.id)
        .limit(4);
      return data || [];
    },
    enabled: !!product?.category_id,
  });

  const handleAddToCart = () => {
    if (!product) return;
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast.error("Please select a color");
      return;
    }
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedSize ?? undefined, selectedColor ?? undefined);
    }
    toast.success(`${quantity}x ${product.name} added to cart`);
  };

  const category = product?.categories as { name: string; slug: string } | null;
  const wishlisted = product ? isInWishlist(product.id) : false;

  // Map known color names to hex for swatches
  const colorMap: Record<string, string> = {
    black: "#111", white: "#fafafa", red: "#dc2626", blue: "#2563eb",
    navy: "#1e3a5f", green: "#16a34a", beige: "#d4c5a9", cream: "#fffdd0",
    brown: "#8b4513", grey: "#9ca3af", gray: "#9ca3af", pink: "#ec4899",
    olive: "#808000", burgundy: "#800020", tan: "#d2b48c", charcoal: "#36454f",
    khaki: "#c3b091", coral: "#ff7f50", sand: "#c2b280", ivory: "#fffff0",
    camel: "#c19a6b", sage: "#bcb88a", rust: "#b7410e", mustard: "#ffdb58",
    lavender: "#e6e6fa", teal: "#008080", maroon: "#800000", plum: "#8e4585",
    taupe: "#483c32", mocha: "#967969", indigo: "#4b0082", emerald: "#50c878",
  };

  const getSwatchColor = (color: string) => {
    const lower = color.toLowerCase();
    return colorMap[lower] || (color.startsWith("#") ? color : undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      {product && (
        <Seo
          title={`${product.name} — TDEV`}
          description={
            product.description
              ? product.description.replace(/\s+/g, " ").slice(0, 160)
              : `Shop ${product.name} from TDEV — sustainable, refined design.`
          }
          path={`/product/${product.slug}`}
          image={product.images?.[0]}
          type="product"
          jsonLd={{
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description ?? undefined,
            image: product.images && product.images.length > 0 ? product.images : undefined,
            sku: (product as any).sku ?? undefined,
            brand: { "@type": "Brand", name: (product as any).brand ?? "TDEV" },
            offers: {
              "@type": "Offer",
              price: product.price,
              priceCurrency: "USD",
              availability: product.in_stock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              url:
                typeof window !== "undefined"
                  ? `${window.location.origin}/product/${product.slug}`
                  : `/product/${product.slug}`,
            },
          }}
        />
      )}
      <Navbar />
      <main className="pt-20 md:pt-24 section-padding pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-body text-muted-foreground mb-8 tracking-wider">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          {category && (
            <>
              <Link to={`/category/${category.slug}`} className="hover:text-foreground transition-colors">
                {category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">{product?.name ?? "..."}</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="aspect-[3/4] w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : product ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Images */}
            <div className="space-y-4">
              <div className="aspect-[3/4] bg-secondary overflow-hidden relative group">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full"
                  >
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[selectedImage]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-display text-6xl text-muted-foreground/20">
                          {product.name[0]}
                        </span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Wishlist button on image */}
                <button
                  onClick={() => toggleWishlist(product)}
                  aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                  aria-pressed={wishlisted}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-background hover:scale-110 z-10"
                >
                  <Heart
                    size={18}
                    className={`transition-colors duration-300 ${wishlisted ? "fill-accent text-accent" : "text-foreground"}`}
                  />
                </button>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="bg-accent text-accent-foreground text-[10px] font-body font-semibold tracking-wider uppercase px-3 py-1.5">
                      {Math.round((1 - product.price / product.compare_at_price) * 100)}% OFF
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnail strip */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      aria-label={`View image ${i + 1} of ${product.name}`}
                      aria-pressed={selectedImage === i}
                      className={`shrink-0 w-20 h-20 overflow-hidden border-2 transition-all duration-300 ${
                        selectedImage === i
                          ? "border-accent ring-1 ring-accent"
                          : "border-border hover:border-foreground/40"
                      }`}
                    >
                      <img src={img} alt={`${product.name} — view ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col">
              <h1 className="font-display text-3xl md:text-4xl font-light text-foreground mb-2">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-body text-2xl font-medium text-foreground">
                  ${product.price.toFixed(2)}
                </span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <>
                    <span className="font-body text-sm text-muted-foreground line-through">
                      ${product.compare_at_price.toFixed(2)}
                    </span>
                    <span className="font-body text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded">
                      Save ${(product.compare_at_price - product.price).toFixed(2)}
                    </span>
                  </>
                )}
              </div>

              {/* Stock indicator */}
              <p className={`font-body text-xs tracking-wider mb-6 ${product.in_stock ? "text-accent" : "text-destructive"}`}>
                {product.in_stock ? "● In Stock — Ready to Ship" : "● Currently Unavailable"}
              </p>

              {product.description && (
                <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8">
                  {product.description}
                </p>
              )}

              {/* Colors — visual swatches */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs tracking-[0.25em] uppercase font-body text-muted-foreground mb-3">
                    Color{selectedColor && <span className="text-foreground ml-2 normal-case tracking-normal">— {selectedColor}</span>}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors.map((color) => {
                      const swatchHex = getSwatchColor(color);
                      const isSelected = selectedColor === color;
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          aria-label={`Select color ${color}`}
                          aria-pressed={isSelected}
                          className={`relative transition-all duration-200 ${
                            swatchHex
                              ? `w-10 h-10 rounded-full border-2 ${isSelected ? "border-accent ring-2 ring-accent/30 scale-110" : "border-border hover:border-foreground/50 hover:scale-105"}`
                              : `px-4 py-2.5 border text-sm font-body tracking-wider rounded-sm ${isSelected ? "border-accent bg-accent text-accent-foreground" : "border-border text-foreground hover:border-foreground"}`
                          }`}
                          style={swatchHex ? { backgroundColor: swatchHex } : undefined}
                          title={color}
                        >
                          {swatchHex && isSelected && (
                            <Check size={16} className="absolute inset-0 m-auto text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                          )}
                          {!swatchHex && color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sizes — pill/chip selector */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs tracking-[0.25em] uppercase font-body text-muted-foreground mb-3">
                    Size{selectedSize && <span className="text-foreground ml-2 normal-case tracking-normal">— {selectedSize}</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[48px] px-4 py-2.5 border text-sm font-body tracking-wider transition-all duration-200 rounded-sm ${
                          selectedSize === size
                            ? "border-accent bg-accent text-accent-foreground font-medium"
                            : "border-border text-foreground hover:border-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity selector */}
              <div className="mb-8">
                <p className="text-xs tracking-[0.25em] uppercase font-body text-muted-foreground mb-3">
                  Quantity
                </p>
                <div className="inline-flex items-center border border-border rounded-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center font-body text-sm text-foreground border-x border-border" aria-live="polite" aria-label={`Quantity ${quantity}`}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                    className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Selection summary */}
              {(selectedSize || selectedColor) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-6 p-3 rounded-sm bg-muted/50 border border-border"
                >
                  <p className="font-body text-xs text-muted-foreground">
                    Selected:{" "}
                    {selectedColor && <span className="text-foreground font-medium">{selectedColor}</span>}
                    {selectedColor && selectedSize && " / "}
                    {selectedSize && <span className="text-foreground font-medium">{selectedSize}</span>}
                    {" × "}
                    <span className="text-foreground font-medium">{quantity}</span>
                    {" — "}
                    <span className="text-accent font-medium">${(product.price * quantity).toFixed(2)}</span>
                  </p>
                </motion.div>
              )}

              {/* Add to Cart + Buy Now */}
              <div className="space-y-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.in_stock}
                  className="w-full font-body text-xs tracking-[0.2em] uppercase bg-foreground text-primary-foreground hover:bg-foreground/90 py-6 gap-2"
                >
                  <ShoppingBag size={18} />
                  {product.in_stock ? "Add to Cart" : "Out of Stock"}
                </Button>

                <Button
                  onClick={() => {
                    handleAddToCart();
                    // Future: navigate to checkout
                  }}
                  disabled={!product.in_stock}
                  variant="outline"
                  className="w-full font-body text-xs tracking-[0.2em] uppercase border-accent text-accent hover:bg-accent hover:text-accent-foreground py-6"
                >
                  Buy Now
                </Button>
              </div>

              {/* Trust badges */}
              <div className="mt-8 pt-6 border-t border-border grid grid-cols-3 gap-4">
                <div className="text-center">
                  <Truck size={18} className="mx-auto text-muted-foreground mb-1.5" />
                  <p className="font-body text-[10px] tracking-wider uppercase text-muted-foreground">Free Shipping</p>
                </div>
                <div className="text-center">
                  <Shield size={18} className="mx-auto text-muted-foreground mb-1.5" />
                  <p className="font-body text-[10px] tracking-wider uppercase text-muted-foreground">Secure Payment</p>
                </div>
                <div className="text-center">
                  <RotateCcw size={18} className="mx-auto text-muted-foreground mb-1.5" />
                  <p className="font-body text-[10px] tracking-wider uppercase text-muted-foreground">Easy Returns</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-muted-foreground">Product not found</p>
            <Link to="/" className="font-body text-sm text-accent hover:underline mt-4 inline-block">
              Return Home
            </Link>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-border">
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-8">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Product;
