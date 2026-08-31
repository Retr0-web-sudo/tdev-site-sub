import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background flex items-center">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/5" />

      <div className="relative z-10 w-full section-padding py-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[10px] tracking-[0.5em] uppercase text-accent font-body mb-4">
              Monthly Subscription
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-foreground leading-[1.05] mb-6">
              Your style,<br />
              <span className="italic text-accent">curated for you.</span>
            </h1>
            <p className="text-muted-foreground font-body text-sm sm:text-base max-w-md mb-8 leading-relaxed">
              Subscribe to a tier, pick outfits you love from our catalog every month, and we'll curate the rest. Delivered to your door.
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
                to="/catalog"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-border/50 text-foreground text-[11px] tracking-[0.15em] uppercase font-body font-medium hover:border-accent/40 transition-all"
              >
                Browse Catalog
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
              {[
                { name: "Essentials", price: "149", items: "2–3 items", desc: "Everyday basics" },
                { name: "Premium", price: "299", items: "4–5 items", desc: "Curated looks", featured: true },
                { name: "Luxe", price: "499", items: "6–8 items", desc: "Full wardrobe refresh" },
              ].map((plan, i) => (
                <motion.div
                  key={plan.name}
                  className={`flex items-center gap-4 p-4 rounded-xl border bg-card/30 backdrop-blur-sm ${plan.featured ? "border-accent/50 ring-1 ring-accent/20" : "border-border/40"}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-foreground">{plan.name}</p>
                    <p className="text-xs font-body text-muted-foreground">{plan.items} · {plan.desc}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-lg font-light text-foreground">GH¢{plan.price}</span>
                    <span className="text-[10px] text-muted-foreground font-body">/mo</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.p
              className="text-center text-[10px] tracking-[0.3em] uppercase text-muted-foreground/50 font-body mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              Free delivery · Cancel anytime · Pick monthly
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
