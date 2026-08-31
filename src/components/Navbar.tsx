import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";

const navItems = [
  { label: "Femme", href: "/category/femme" },
  { label: "Homme", href: "/category/homme" },
  { label: "Global", href: "/category/global" },
  { label: "Subscribe", href: "/subscription/plans" },
  { label: "Journal", href: "/blog" },
  { label: "About", href: "/#about" },
  { label: "Arcade", href: "/games" },
  { label: "Contact", href: "/#contact" },
];

const ToteIcon = ({ count }: { count: number }) => (
  <div className="relative">
    <svg width="22" height="24" viewBox="0 0 22 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300">
      <path d="M3 8h16l-1.5 14H4.5L3 8z" />
      <path d="M7.5 8V5.5a3.5 3.5 0 0 1 7 0V8" />
    </svg>
    {count > 0 && (
      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] bg-accent text-accent-foreground text-[9px] font-body font-semibold rounded-full flex items-center justify-center px-1">
        {count}
      </motion.span>
    )}
  </div>
);

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { openCart, totalItems } = useCart();
  const { totalItems: wishlistTotal } = useWishlist();
  const location = useLocation();

  useEffect(() => {
    // Always use dark mode
    document.documentElement.classList.add("dark");
    localStorage.setItem("tdev-theme", "dark");
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const logoIsLight = !scrolled;

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-background/90 backdrop-blur-xl border-b border-border/40 shadow-sm" : "bg-transparent border-b border-transparent nav-hero"
      }`}
      initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="section-padding flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center group relative z-10">
          <span className={`text-3xl md:text-4xl transition-all duration-300 group-hover:opacity-80 ${logoIsLight ? "text-white" : "text-foreground"}`}
            style={{ fontFamily: "'Pacifico', cursive", lineHeight: 1.4, textShadow: logoIsLight ? '0 2px 10px rgba(0,0,0,0.7), 0 0 30px rgba(255,255,255,0.3)' : 'none' }}>
            Drip
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 lg:gap-12 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) =>
            item.href.startsWith("/") && !item.href.startsWith("/#") ? (
              <Link key={item.label} to={item.href} className={`nav-link ${location.pathname === item.href ? "nav-link-active" : ""}`}>{item.label}</Link>
            ) : (
              <a key={item.label} href={item.href.replace("/#", "#")} className="nav-link">{item.label}</a>
            )
          )}
        </div>

        <div className="flex items-center gap-4">

          <Link to="/wishlist" className="relative text-foreground hover:text-accent transition-all duration-300 hover:scale-105" aria-label="Wishlist">
            <Heart size={18} />
            {wishlistTotal > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] bg-accent text-accent-foreground text-[8px] font-body font-semibold rounded-full flex items-center justify-center px-0.5">
                {wishlistTotal}
              </motion.span>
            )}
          </Link>

          <button onClick={openCart} className="text-foreground hover:text-accent transition-all duration-300 hover:scale-105" aria-label="Open cart">
            <ToteIcon count={totalItems} />
          </button>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-foreground hover:text-accent transition-colors" aria-label="Toggle menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border/30" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
