import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles, Crown, Star, Package } from "lucide-react";

const plans = [
  { name: "Essentials", price: "149", icon: Sparkles, items: "2–3 items", desc: "Everyday basics curated to your taste", color: "border-border/40" },
  { name: "Premium", price: "299", icon: Star, items: "4–5 items", desc: "Curated looks with exclusive pieces", color: "border-accent/50", featured: true },
  { name: "Luxe", price: "499", icon: Crown, items: "6–8 items", desc: "Designer-level curation, full wardrobe refresh", color: "border-accent/20" },
];

const CollectionsGrid = () => {
  return (
    <section id="collections" className="section-padding py-16 sm:py-24 md:py-36">
      <motion.div
        className="mb-8 sm:mb-14 md:mb-24 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div>
          <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground font-body mb-2 sm:mb-3">
            How It Works
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-6xl font-light text-foreground leading-[1.1]">
            Pick a plan.<br />
            <span className="italic">Build your box.</span>
          </h2>
        </div>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-body text-muted-foreground hover:text-foreground transition-colors duration-300 border-b border-border pb-1 self-start sm:self-auto"
        >
          Browse catalog
          <ArrowUpRight size={14} />
        </Link>
      </motion.div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        {plans.map((plan, i) => {
          const Icon = plan.icon;
          return (
            <motion.div
              key={plan.name}
              className={`relative flex flex-col bg-card/50 border rounded-xl p-6 sm:p-8 transition-all duration-300 hover:border-accent/30 ${plan.color} ${plan.featured ? "md:-mt-4 md:mb-[-16px]" : ""}`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.12, ease: "easeOut" }}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[9px] tracking-[0.15em] uppercase font-body font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <Icon size={18} className="text-accent" />
                <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-body">{plan.name}</span>
              </div>
              <div className="mb-4">
                <span className="font-display text-4xl font-light text-foreground">GH¢ {plan.price}</span>
                <span className="text-muted-foreground font-body text-sm ml-1">/month</span>
              </div>
              <p className="text-muted-foreground font-body text-sm mb-2">{plan.desc}</p>
              <p className="text-accent font-body text-xs mb-6">{plan.items} in your box</p>
              <Link
                to={`/subscription/build-box?plan=${plan.name.toLowerCase()}`}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-full text-[11px] tracking-[0.15em] uppercase font-body font-medium transition-all duration-300 mt-auto ${
                  plan.featured
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Package size={14} /> Build Box
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Steps */}
      <motion.div
        className="mt-16 sm:mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {[
          { step: "1", title: "Choose Your Tier", desc: "Essentials, Premium, or Luxe — pick what fits your style and budget." },
          { step: "2", title: "Build Your Box", desc: "Browse the catalog and handpick outfits you love. We'll fill the rest." },
          { step: "3", title: "Delivered Monthly", desc: "Your curated box arrives at your door. Pause, skip, or cancel anytime." },
        ].map((s, i) => (
          <motion.div key={i} className="text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
            <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center mx-auto mb-3 font-display text-lg font-light">{s.step}</div>
            <h3 className="font-display text-lg font-light text-foreground mb-1">{s.title}</h3>
            <p className="text-muted-foreground font-body text-sm">{s.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default CollectionsGrid;
