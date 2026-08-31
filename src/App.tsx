import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { WishlistProvider } from "@/hooks/useWishlist";
import { ThemeSettingsProvider } from "@/hooks/useThemeSettings";
import { CartProvider } from "@/hooks/useCart";
import CartDrawer from "@/components/CartDrawer";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Category from "./pages/Category";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Wishlist from "./pages/Wishlist";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import ResetPassword from "./pages/ResetPassword";
import Checkout from "./pages/Checkout";
import Contact from "./pages/Contact";
import Customize from "./pages/Customize";
import Games from "./pages/Games";
import NotFound from "./pages/NotFound";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import StyleQuiz from "./pages/StyleQuiz";
import SubscriptionCheckout from "./pages/SubscriptionCheckout";
import SubscriptionDashboard from "./pages/SubscriptionDashboard";

const queryClient = new QueryClient();

const AppInner = () => {
  return (
    <>
      <ScrollToTop />
      <CartDrawer />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/category/:slug" element={<Category />} />
        <Route path="/product/:slug" element={<Product />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/customize" element={<Customize />} />
        <Route path="/games" element={<Games />} />
        <Route path="/subscription/plans" element={<SubscriptionPlans />} />
        <Route path="/subscription/quiz" element={<StyleQuiz />} />
        <Route path="/subscription/checkout" element={<SubscriptionCheckout />} />
        <Route path="/subscription/dashboard" element={<SubscriptionDashboard />} />
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
            <WishlistProvider>
              <CartProvider>
                <AppInner />
              </CartProvider>
            </WishlistProvider>
          </ThemeSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
