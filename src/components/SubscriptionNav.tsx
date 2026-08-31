import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const subNavItems = [
  { label: "Plans", href: "/subscription/plans" },
  { label: "Catalog", href: "/shop" },
  { label: "My Box", href: "/subscription/dashboard" },
  { label: "Wishlist", href: "/wishlist" },
];

const SubscriptionNav = () => {
  const location = useLocation();

  return (
    <div className="flex items-center gap-1 bg-card/50 border border-border/40 rounded-full px-1.5 py-1">
      {subNavItems.map((item) => {
        const active = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`relative px-4 py-1.5 text-[11px] tracking-[0.12em] uppercase font-body font-medium transition-colors duration-300 rounded-full ${
              active ? "text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {active && (
              <motion.div
                layoutId="subnav-active"
                className="absolute inset-0 bg-accent rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default SubscriptionNav;
