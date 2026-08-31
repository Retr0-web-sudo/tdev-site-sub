import { useQuery } from "@tanstack/react-query";
import { storefrontApiRequest, STOREFRONT_PRODUCTS_QUERY, type ShopifyProduct } from "@/lib/shopify";
import ShopifyProductCard from "@/components/ShopifyProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag } from "lucide-react";
import { useRegionStore } from "@/stores/regionStore";

const ShopifyProductsSection = () => {
  const countryCode = useRegionStore((s) => s.countryCode);
  const { data: products, isLoading } = useQuery({
    queryKey: ["shopify-products", countryCode],
    queryFn: async () => {
      const data = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, { first: 20, country: countryCode });
      return (data?.data?.products?.edges || []) as ShopifyProduct[];
    },
  });

  return (
    <section className="section-padding py-12 sm:py-20">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-light text-foreground mb-2 sm:mb-3">
          Shop the Collection
        </h2>
        <p className="font-body text-xs sm:text-sm text-muted-foreground tracking-wider">
          Curated pieces for the modern wardrobe
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[3/4] w-full mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6">
          {products.map((product) => (
            <ShopifyProductCard key={product.node.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <ShoppingBag size={48} className="mx-auto text-muted-foreground/20 mb-4" />
          <p className="font-body text-muted-foreground">No products yet — tell us what you'd like to sell!</p>
        </div>
      )}
    </section>
  );
};

export default ShopifyProductsSection;
