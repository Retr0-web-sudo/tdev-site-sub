import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Seo from "@/components/Seo";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

// Default fallback images
import uniqueFemmeBlossoms from "@/assets/unique-femme-blossoms.jpg";
import uniqueFemmePearls from "@/assets/unique-femme-pearls.jpg";
import uniqueFemmeLavender from "@/assets/unique-femme-lavender.jpg";
import tdevFemmeJellyfish from "@/assets/tdev-femme-jellyfish.jpg";
import cottonBranches from "@/assets/cotton-branches.jpg";
import seasonalSpringRoses from "@/assets/seasonal-spring-roses.jpg";

import uniqueHommeWool from "@/assets/unique-homme-wool.jpg";
import uniqueHommeLeather from "@/assets/unique-homme-leather.jpg";
import uniqueHommeMountains from "@/assets/unique-homme-mountains.jpg";
import uniqueHommeAccessories from "@/assets/unique-homme-accessories.jpg";
import tdevHommeCotton from "@/assets/tdev-homme-cotton.jpg";
import seasonalWinterPine from "@/assets/seasonal-winter-pine.jpg";
import seasonalAutumnLeaves from "@/assets/seasonal-autumn-leaves.jpg";

import uniqueGlobalTextiles from "@/assets/unique-global-textiles.jpg";
import uniqueGlobalBotanicals from "@/assets/unique-global-botanicals.jpg";
import uniqueGlobalDesert from "@/assets/unique-global-desert.jpg";
import uniqueGlobalOcean from "@/assets/unique-global-ocean.jpg";
import tdevGlobalCottonField from "@/assets/tdev-global-cotton-field.jpg";
import seasonalSummerWheat from "@/assets/seasonal-summer-wheat.jpg";
import seasonalSummerSunflowers from "@/assets/seasonal-summer-sunflowers.jpg";

const defaultSlides: Record<string, { image: string }[]> = {
  femme: [
    { image: uniqueFemmeBlossoms }, { image: uniqueFemmePearls }, { image: uniqueFemmeLavender },
    { image: tdevFemmeJellyfish }, { image: cottonBranches }, { image: seasonalSpringRoses },
  ],
  homme: [
    { image: uniqueHommeWool }, { image: uniqueHommeLeather }, { image: uniqueHommeMountains },
    { image: uniqueHommeAccessories }, { image: tdevHommeCotton }, { image: seasonalWinterPine },
    { image: seasonalAutumnLeaves },
  ],
  global: [
    { image: uniqueGlobalTextiles }, { image: uniqueGlobalBotanicals }, { image: uniqueGlobalDesert },
    { image: uniqueGlobalOcean }, { image: tdevGlobalCottonField }, { image: seasonalSummerWheat },
    { image: seasonalSummerSunflowers },
  ],
};

interface CarouselSlide {
  image_url: string;
  alt_text: string;
}

const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  const onApiChange = (newApi: CarouselApi) => {
    if (!newApi) return;
    setApi(newApi);
    setCurrent(newApi.selectedScrollSnap());
    newApi.on("select", () => setCurrent(newApi.selectedScrollSnap()));
  };

  // Fetch admin-managed carousel images
  const { data: adminSlides } = useQuery({
    queryKey: ["carousel-images", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "carousel_images")
        .single();
      if (!data?.value || typeof data.value !== "object" || Array.isArray(data.value)) return null;
      const val = data.value as unknown as Record<string, CarouselSlide[]>;
      const categorySlides = val[slug!.toLowerCase()];
      if (categorySlides && categorySlides.length > 0) {
        return categorySlides.filter((s) => s.image_url);
      }
      return null;
    },
    enabled: !!slug,
  });

  const { data: category, isLoading: catLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").ilike("slug", slug!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: products, isLoading: prodsLoading } = useQuery({
    queryKey: ["products", category?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("category_id", category!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!category?.id,
  });

  // Use admin slides if available, otherwise fall back to defaults
  const slides = adminSlides
    ? adminSlides.map((s) => ({ image: s.image_url }))
    : slug ? defaultSlides[slug.toLowerCase()] ?? null : null;

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={category ? `${category.name} Collection — TDEV` : `${slug} Collection — TDEV`}
        description={category?.description ?? `Explore the ${category?.name ?? slug} collection from TDEV — sustainable fashion rooted in nature.`}
        path={`/category/${slug}`}
      />
      <Navbar />
      
      
      {slides && slides.length > 0 && (
        <div className="relative h-[70vh] sm:h-[80vh] overflow-hidden">
          <Carousel className="h-full" opts={{ loop: true }} plugins={[autoplayPlugin.current]} setApi={onApiChange}>
            <CarouselContent className="h-full -ml-0">
              {slides.map((slide, index) => (
                <CarouselItem key={index} className="pl-0 h-full">
                  <div className="relative h-full">
                    <img src={slide.image} alt={`${category?.name || slug} collection`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <button onClick={() => api?.scrollPrev()} className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10" aria-label="Previous slide">
            <ChevronLeft className="w-10 h-10 sm:w-14 sm:h-14" strokeWidth={1} />
          </button>
          <button onClick={() => api?.scrollNext()} className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10" aria-label="Next slide">
            <ChevronRight className="w-10 h-10 sm:w-14 sm:h-14" strokeWidth={1} />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
            {slides.map((_, index) => (
              <button key={index} onClick={() => api?.scrollTo(index)} className={`w-2 h-2 rounded-full transition-all ${index === current ? "bg-white" : "bg-white/40"}`} aria-label={`Go to slide ${index + 1}`} />
            ))}
          </div>
        </div>
      )}

      <main id="products" className={`section-padding pb-16 sm:pb-20 ${slides ? 'pt-8 sm:pt-12' : 'pt-20 md:pt-24'}`}>
        <Link to="/shop" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm tracking-wider mb-8">
          <ArrowLeft size={16} /> Back to Collections
        </Link>

        {!slides && catLoading ? (
          <Skeleton className="h-12 w-64 mb-4" />
        ) : !slides && category ? (
          <div className="mb-8 sm:mb-12 md:mb-16">
            <p className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-muted-foreground font-body mb-2 sm:mb-3">Collection</p>
            <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-light text-foreground">{category.name}</h1>
            {category.description && <p className="font-body text-sm text-muted-foreground mt-3 sm:mt-4 max-w-xl leading-relaxed">{category.description}</p>}
          </div>
        ) : !slides && !category ? (
          <p className="font-body text-muted-foreground">Category not found.</p>
        ) : category?.description ? (
          <p className="font-body text-sm text-muted-foreground mb-8 max-w-xl leading-relaxed">{category.description}</p>
        ) : null}

        {(catLoading || prodsLoading) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[3/4] w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <>
            <h2 className="sr-only">{category?.name ?? slug} products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-muted-foreground">No products yet</p>
            <p className="font-body text-sm text-muted-foreground/60 mt-2">Check back soon for new arrivals.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Category;
