import Navbar from "@/components/Navbar";
import AnnouncementBar from "@/components/AnnouncementBar";
import HeroSection from "@/components/HeroSection";
import CollectionsGrid from "@/components/CollectionsGrid";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";

const Index = () => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="TDEV — Curated Fashion, Delivered Monthly"
        description="Subscribe to TDEV. Browse our catalog, pick your outfits, and receive a curated box every month. Essentials, Premium, or Luxe."
        path="/"
        type="website"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "TDEV",
            url: origin || undefined,
            logo: origin ? `${origin}/drip-logo.png` : undefined,
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "TDEV",
            url: origin || undefined,
          },
        ]}
      />
      <AnnouncementBar />
      <Navbar />
      <HeroSection />
      <CollectionsGrid />
      <Footer />
    </div>
  );
};

export default Index;
