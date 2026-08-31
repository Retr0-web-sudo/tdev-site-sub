import Navbar from "@/components/Navbar";
import AnnouncementBar from "@/components/AnnouncementBar";
import HeroSection from "@/components/HeroSection";
import CollectionsGrid from "@/components/CollectionsGrid";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";

const Index = () => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="TDEV — Sustainable Fashion, Global Collections"
        description="Explore TDEV's Femme, Homme, and Global collections. Sustainable fashion rooted in nature, refined by design."
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
      <AboutSection />
      <Footer />
    </div>
  );
};

export default Index;

