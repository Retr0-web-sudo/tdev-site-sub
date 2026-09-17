import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, Bell, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import CurrencySwitcher from "@/components/CurrencySwitcher";

const navItems = [
  { label: "Catalog", href: "/shop" },
  { label: "Plans", href: "/subscription/plans" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Journal", href: "/blog" },
  { label: "Contact", href: "/#contact" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const token = localStorage.getItem("tdev_token");
        const res = await fetch("/api/notifications/unread-count", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success) setUnreadCount(data.data.count);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("tdev-theme", "dark");
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-background/90 backdrop-blur-xl border-b border-border/40 shadow-sm" : "bg-transparent border-b border-transparent nav-hero"
      }`}
      initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="section-padding flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center group relative z-10">
          <img
            src="/logo-white.png"
            alt="TDEV | Tenue de Ville"
            className="h-10 md:h-12 w-auto transition-all duration-300 group-hover:opacity-80"
          />
        </Link>

        <div className="hidden lg:flex items-center gap-5 xl:gap-8 absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
          {navItems.map((item) =>
            item.href.startsWith("/") && !item.href.startsWith("/#") ? (
              <Link key={item.label} to={item.href} className={`nav-link ${location.pathname === item.href ? "nav-link-active" : ""}`}>{item.label}</Link>
            ) : (
              <a key={item.label} href={item.href.replace("/#", "#")} className="nav-link">{item.label}</a>
            )
          )}
        </div>

        <div className="flex items-center gap-3 xl:gap-4">
          {user ? (
            <>
              <Link to="/wishlist" className="relative text-foreground hover:text-accent transition-all duration-300 hidden md:block" aria-label="Wishlist">
                <Heart size={18} />
              </Link>
              <Link to="/notifications" className="relative text-foreground hover:text-accent transition-all duration-300 hidden md:block" aria-label="Notifications">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-[16px] bg-accent text-accent-foreground text-[8px] font-body font-semibold rounded-full flex items-center justify-center px-0.5">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link to={isAdmin ? "/admin" : "/subscription/dashboard"} className="flex items-center gap-1.5 text-foreground hover:text-accent transition-all duration-300">
                <User size={18} />
                <span className="hidden lg:inline text-xs font-body tracking-wider">{isAdmin ? "Admin" : "Dashboard"}</span>
              </Link>
            </>
          ) : (
            <Link to="/auth" className="text-xs font-body tracking-[0.15em] uppercase text-foreground hover:text-accent transition-colors">
              Sign In
            </Link>
          )}

          <CurrencySwitcher className="hidden lg:flex" />

          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-foreground hover:text-accent transition-colors" aria-label="Toggle menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="lg:hidden bg-background/95 backdrop-blur-xl border-t border-border/30" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
            <div className="section-padding py-10 flex flex-col gap-6">
              {navItems.map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08, duration: 0.3 }}>
                  {item.href.startsWith("/") && !item.href.startsWith("/#") ? (
                    <Link to={item.href} onClick={() => setMobileOpen(false)} className="nav-link text-xl block">{item.label}</Link>
                  ) : (
                    <a href={item.href.replace("/#", "#")} onClick={() => setMobileOpen(false)} className="nav-link text-xl block">{item.label}</a>
                  )}
                </motion.div>
              ))}
              {!user && (
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="nav-link text-xl block text-accent">Sign In</Link>
              )}
              <CurrencySwitcher className="mt-4" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
