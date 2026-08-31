import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Crown, Star } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background flex items-center">
      {/* Subtle gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/5" />

      <div className="relative z-10 w-full section-padding py-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] tracking-[0.5em] uppercase text-accent font-body mb-4">
              Subscription Fashion
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-foreground leading-[1.05] mb-6">
              Your style,<br />
              <span className="italic text-accent">curated monthly.</span>
            </h1>
            <p className="text-muted-foreground font-body text-sm sm:text-base max-w-md mb-8 leading-relaxed">
              TDEV picks pieces that match your taste — from casual essentials to designer statement looks. Delivered to your door every month.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/subscription/plans"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-accent text-accent-foreground text-[11px] tracking-[0.15em] uppercase font-body font-medium hover:bg-accent/90 transition-all"
              >
                See Plans
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-border/50 text-foreground text-[11px] tracking-[0.15em] uppercase font-body font-medium hover:border-accent/40 transition-all"
              >
                Browse Shop
              </Link>
            </div>
          </motion.div>

          {/* Right: Plan Preview Cards */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
              {[
                { name: "Essentials", price: "149", icon: Sparkles, items: "2–3 items", color: "border-border/40" },
                { name: "Premium", price: "299", icon: Star, items: "4–5 items", color: "border-accent/50", featured: true },
                { name: "Luxe", price: "499", icon: Crown, items: "6–8 items", color: "border-accent/20" },
              ].map((plan, i) => {
                const Icon = plan.icon;
                return (
                  <motion.div
                    key={plan.name}
                    className={`flex items-center gap-4 p-4 rounded-xl border bg-card/30 backdrop-blur-sm ${plan.color} ${plan.featured ? "ring-1 ring-accent/20" : ""}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${plan.featured ? "bg-accent/15" : "bg-secondary"}`}>
                      <Icon size={16} className={plan.featured ? "text-accent" : "text-muted-foreground"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-medium text-foreground">{plan.name}</p>
                      <p className="text-xs font-body text-muted-foreground">{plan.items}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-lg font-light text-foreground">GH¢{plan.price}</span>
                      <span className="text-[10px] text-muted-foreground font-body">/mo</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.p
              className="text-center text-[10px] tracking-[0.3em] uppercase text-muted-foreground/50 font-body mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              Free delivery · Cancel anytime
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
