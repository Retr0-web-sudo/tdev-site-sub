import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { storefrontApiRequest, STOREFRONT_PRODUCT_BY_HANDLE_QUERY, STOREFRONT_PRODUCTS_QUERY, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { useRegionStore } from "@/stores/regionStore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShopifyProductCard from "@/components/ShopifyProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Minus, Plus, Check, Truck, Shield, RotateCcw, Loader2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const ShopifyProduct = () => {
  const { handle } = useParams<{ handle: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const getCheckoutUrl = useCartStore((s) => s.getCheckoutUrl);
  const countryCode = useRegionStore((s) => s.countryCode);

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["shopify-product", handle, countryCode],
    queryFn: async () => {
      const data = await storefrontApiRequest(STOREFRONT_PRODUCT_BY_HANDLE_QUERY, { handle, country: countryCode });
      return data?.data?.productByHandle || null;
    },
    enabled: !!handle,
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ["shopify-related-products", countryCode],
    queryFn: async () => {
      const data = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, { first: 4, country: countryCode });
      const allProducts = (data?.data?.products?.edges || []) as ShopifyProduct[];
      return allProducts.filter((p) => p.node.handle !== handle);
    },
    enabled: !!product,
  });

  // Find matching variant based on selected options
  const getSelectedVariant = () => {
    if (!product) return null;
    const options = product.options || [];
    // If no options to select (single variant), return first
    if (options.length === 0 || (options.length === 1 && options[0].values.length === 1)) {
      return product.variants.edges[0]?.node;
    }
    // Find variant matching all selected options
    return product.variants.edges.find((v: { node: { selectedOptions: Array<{ name: string; value: string }> } }) =>
      v.node.selectedOptions.every((opt: { name: string; value: string }) => selectedOptions[opt.name] === opt.value)
    )?.node;
  };

  const selectedVariant = getSelectedVariant();
  const images = product?.images?.edges || [];
  const options = product?.options?.filter((o: { name: string; values: string[] }) => !(o.values.length === 1 && o.values[0] === "Default Title")) || [];

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) {
      toast.error("Please select all options");
      return;
    }
    if (!selectedVariant.availableForSale) {
      toast.error("This variant is sold out");
      return;
    }
    await addItem({
      product: { node: product } as ShopifyProduct,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity,
      selectedOptions: selectedVariant.selectedOptions || [],
    });
    toast.success(`Added to cart`, { position: "top-center" });
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    const checkoutUrl = getCheckoutUrl();
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  // Color swatch mapping
  const colorMap: Record<string, string> = {
    black: "#111", white: "#fafafa", red: "#dc2626", blue: "#2563eb",
    navy: "#1e3a5f", green: "#16a34a", beige: "#d4c5a9", cream: "#fffdd0",
    brown: "#8b4513", grey: "#9ca3af", gray: "#9ca3af", pink: "#ec4899",
    olive: "#808000", burgundy: "#800020", charcoal: "#36454f", coral: "#ff7f50",
    sage: "#bcb88a", rust: "#b7410e", mustard: "#ffdb58", teal: "#008080",
  };
  const getSwatchColor = (color: string) => colorMap[color.toLowerCase()] || (color.startsWith("#") ? color : undefined);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 md:pt-24 section-padding pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-body text-muted-foreground mb-8 tracking-wider">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground">{product?.title ?? "..."}</span>
        </div>

        {productLoading ? (
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
                    {images[selectedImage] ? (
                      <img
                        src={images[selectedImage].node.url}
                        alt={images[selectedImage].node.altText || product.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-display text-6xl text-muted-foreground/20">{product.title[0]}</span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {images.map((img: { node: { url: string; altText: string | null } }, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`shrink-0 w-20 h-20 overflow-hidden border-2 transition-all duration-300 ${
                        selectedImage === i ? "border-accent ring-1 ring-accent" : "border-border hover:border-foreground/40"
                      }`}
                    >
                      <img src={img.node.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col">
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-light text-foreground mb-2">
                {product.title}
              </h1>

              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-body text-2xl font-medium text-foreground">
                  {product.priceRange.minVariantPrice.currencyCode} {parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}
                </span>
              </div>

              <p className={`font-body text-xs tracking-wider mb-6 ${selectedVariant?.availableForSale !== false ? "text-accent" : "text-destructive"}`}>
                {selectedVariant?.availableForSale !== false ? "● In Stock — Ready to Ship" : "● Currently Unavailable"}
              </p>

              {product.description && (
                <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8">
                  {product.description}
                </p>
              )}

              {/* Options */}
              {options.map((option: { name: string; values: string[] }) => {
                const isColor = option.name.toLowerCase() === "color" || option.name.toLowerCase() === "colour";
                return (
                  <div key={option.name} className="mb-6">
                    <p className="text-xs tracking-[0.25em] uppercase font-body text-muted-foreground mb-3">
                      {option.name}
                      {selectedOptions[option.name] && (
                        <span className="text-foreground ml-2 normal-case tracking-normal">— {selectedOptions[option.name]}</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {option.values.map((value: string) => {
                        const isSelected = selectedOptions[option.name] === value;
                        const swatchHex = isColor ? getSwatchColor(value) : undefined;
                        return (
                          <button
                            key={value}
                            onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.name]: value }))}
                            className={`relative transition-all duration-200 ${
                              swatchHex
                                ? `w-10 h-10 rounded-full border-2 ${isSelected ? "border-accent ring-2 ring-accent/30 scale-110" : "border-border hover:border-foreground/50 hover:scale-105"}`
                                : `min-w-[48px] px-4 py-2.5 border text-sm font-body tracking-wider rounded-sm ${isSelected ? "border-accent bg-accent text-accent-foreground font-medium" : "border-border text-foreground hover:border-foreground"}`
                            }`}
                            style={swatchHex ? { backgroundColor: swatchHex } : undefined}
                            title={value}
                          >
                            {swatchHex && isSelected && (
                              <Check size={16} className="absolute inset-0 m-auto text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                            )}
                            {!swatchHex && value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Quantity */}
              <div className="mb-8">
                <p className="text-xs tracking-[0.25em] uppercase font-body text-muted-foreground mb-3">Quantity</p>
                <div className="inline-flex items-center border border-border rounded-sm">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-muted transition-colors" disabled={quantity <= 1}>
                    <Minus size={14} />
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center font-body text-sm text-foreground border-x border-border">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-muted transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={isLoading || !selectedVariant?.availableForSale}
                  className="w-full font-body text-xs tracking-[0.2em] uppercase bg-foreground text-primary-foreground hover:bg-foreground/90 py-6 gap-2"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ShoppingBag size={18} />}
                  {selectedVariant?.availableForSale !== false ? "Add to Cart" : "Out of Stock"}
                </Button>

                <Button
                  onClick={handleBuyNow}
                  disabled={isLoading || !selectedVariant?.availableForSale}
                  variant="outline"
                  className="w-full font-body text-xs tracking-[0.2em] uppercase border-accent text-accent hover:bg-accent hover:text-accent-foreground py-6 gap-2"
                >
                  <ExternalLink size={16} />
                  Buy Now
                </Button>
              </div>

              {/* Trust badges */}
              <div className="mt-8 pt-6 border-t border-border grid grid-cols-3 gap-2 sm:gap-4">
                <div className="text-center">
                  <Truck size={16} className="mx-auto text-muted-foreground mb-1 sm:mb-1.5 sm:w-[18px] sm:h-[18px]" />
                  <p className="font-body text-[8px] sm:text-[10px] tracking-wider uppercase text-muted-foreground">Free Shipping</p>
                </div>
                <div className="text-center">
                  <Shield size={16} className="mx-auto text-muted-foreground mb-1 sm:mb-1.5 sm:w-[18px] sm:h-[18px]" />
                  <p className="font-body text-[8px] sm:text-[10px] tracking-wider uppercase text-muted-foreground">Secure Payment</p>
                </div>
                <div className="text-center">
                  <RotateCcw size={16} className="mx-auto text-muted-foreground mb-1 sm:mb-1.5 sm:w-[18px] sm:h-[18px]" />
                  <p className="font-body text-[8px] sm:text-[10px] tracking-wider uppercase text-muted-foreground">Easy Returns</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-muted-foreground">Product not found</p>
            <Link to="/" className="font-body text-sm text-accent hover:underline mt-4 inline-block">Return Home</Link>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-border">
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6">
              {relatedProducts.slice(0, 4).map((p) => (
                <ShopifyProductCard key={p.node.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ShopifyProduct;
