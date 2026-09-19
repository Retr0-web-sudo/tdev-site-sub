import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeSettingsProvider } from "@/hooks/useThemeSettings";
import { CurrencyProvider } from "@/lib/currency";
import { WishlistProvider } from "@/hooks/useWishlist";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Category from "./pages/Category";
import Product from "./pages/Product";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import ResetPassword from "./pages/ResetPassword";
import Contact from "./pages/Contact";
import Wishlist from "./pages/Wishlist";
import Notifications from "./pages/Notifications";
import { TermsPage, PrivacyPage, CookiePage } from "@/pages/Legal";
import NotFound from "./pages/NotFound";
import Catalog from "./pages/Catalog";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import StyleQuiz from "./pages/StyleQuiz";
import BoxBuilder from "./pages/BoxBuilder";
import SubscriptionCheckout from "./pages/SubscriptionCheckout";
import SubscriptionDashboard from "./pages/SubscriptionDashboard";

const queryClient = new QueryClient();

const AppInner = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/shop" element={<Catalog />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/category/:slug" element={<Category />} />
        <Route path="/product/:slug" element={<Product />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/subscription/plans" element={<SubscriptionPlans />} />
        <Route path="/subscription/quiz" element={<StyleQuiz />} />
        <Route path="/subscription/build-box" element={<BoxBuilder />} />
        <Route path="/subscription/checkout" element={<SubscriptionCheckout />} />
        <Route path="/subscription/dashboard" element={<SubscriptionDashboard />} />
        
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/cookies" element={<CookiePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeSettingsProvider>
                      <CurrencyProvider>
                        <WishlistProvider>
                          <AppInner />
                        </WishlistProvider>
                      </CurrencyProvider>
                    </ThemeSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
