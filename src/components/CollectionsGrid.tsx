import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, Package, Sparkles, Star, Crown, Check, Shirt, Palette, Truck, RotateCcw, Heart, MessageSquare } from "lucide-react";

const plans = [
  { name: "Essentials", price: "149", items: "2–3 items", desc: "Everyday basics curated to your taste", color: "border-border/40", icon: Sparkles },
  { name: "Premium", price: "299", items: "4–5 items", desc: "Curated looks with exclusive pieces", color: "border-accent/50", featured: true, icon: Star },
  { name: "Luxe", price: "499", items: "6–8 items", desc: "Designer-level curation, full wardrobe refresh", color: "border-accent/20", icon: Crown },
];

const steps = [
  {
    step: "1",
    title: "Take the Style Quiz",
    desc: "Tell us your style DNA, sizes, colours, budget, and lifestyle. It takes 2 minutes and helps us recommend the perfect plan.",
    details: [
      "Pick your style personality (Minimalist, Streetwear, etc.)",
      "Select sizes, colour palette, and budget range",
      "Tell us your lifestyle: workwear, casual, date night",
    ],
    icon: Palette,
  },
  {
    step: "2",
    title: "Choose Your Plan",
    desc: "We'll recommend a tier based on your quiz. Or pick your own — Essentials, Premium, or Luxe. Switch anytime.",
    details: [
      "Essentials (GH¢149/mo): 2–3 everyday basics",
      "Premium (GH¢299/mo): 4–5 curated looks + exclusives",
      "Luxe (GH¢499/mo): 6–8 designer-level pieces",
    ],
    icon: Package,
  },
  {
    step: "3",
    title: "Build Your Box",
    desc: "Pick a theme (Workwear, Date Night, Streetwear…), browse the catalog, and select your favourites. Or let our stylists surprise you.",
    details: [
      "Choose a monthly theme for your box",
      "Browse and pick items that match your style",
      "Add notes for your stylist if you need something specific",
    ],
    icon: Shirt,
  },
  {
    step: "4",
    title: "We Curate & Deliver",
    desc: "Our stylists fill the rest of your box with pieces that match your taste. Free delivery, free returns, every single month.",
    details: [
      "Expert stylists complement your picks",
      "Free delivery across Ghana",
      "Keep 5+ items and save 10% next month",
    ],
    icon: Truck,
  },
];

const features = [
  { icon: RotateCcw, title: "Swap Anytime", desc: "Don't like something in your box? Swap it before we ship. Your box, your rules." },
  { icon: Heart, title: "Wishlist Engineering", desc: "Save pieces you love. If they're locked to a higher tier, your wishlist shows you exactly what upgrading unlocks." },
  { icon: MessageSquare, title: "Stylist Notes", desc: "Leave notes for your curator each month. Tell them what you need, what you love, what to avoid." },
];

const CollectionsGrid = () => {
  return (
    <section id="how-it-works" className="section-padding py-16 sm:py-24 md:py-36">
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
            Fashion on your terms.<br />
            <span className="italic">Every single month.</span>
          </h2>
        </div>
        <Link
          to="/subscription/quiz"
          className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-body text-muted-foreground hover:text-foreground transition-colors duration-300 border-b border-border pb-1 self-start sm:self-auto"
        >
          Take the style quiz
          <ArrowUpRight size={14} />
        </Link>
      </motion.div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto mb-16 sm:mb-24">
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
                <span className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground">{plan.name}</span>
              </div>
              <div className="mb-4">
                <span className="font-display text-4xl font-light text-foreground">GH¢ {plan.price}</span>
                <span className="text-muted-foreground font-body text-sm ml-1">/month</span>
              </div>
              <p className="text-muted-foreground font-body text-sm mb-2">{plan.desc}</p>
              <p className="text-accent font-body text-xs mb-6">{plan.items} in your box</p>
              <Link
                to={`/subscription/quiz?plan=current`}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-full text-[11px] tracking-[0.15em] uppercase font-body font-medium transition-all duration-300 mt-auto ${
                  plan.featured
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Sparkles size={14} /> Start with Quiz
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Detailed Steps */}
      <div className="max-w-5xl mx-auto mb-16 sm:mb-24">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground font-body mb-3">The Process</p>
          <h3 className="font-display text-2xl sm:text-3xl font-light text-foreground">
            From quiz to doorstep in <span className="italic text-accent">4 simple steps</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                className="bg-card/50 border border-border/40 rounded-xl p-6 sm:p-8 hover:border-accent/20 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center flex-shrink-0 font-display text-lg font-light">
                    {s.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={16} className="text-accent" />
                      <h4 className="font-display text-lg font-light text-foreground">{s.title}</h4>
                    </div>
                    <p className="text-muted-foreground font-body text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
                <ul className="ml-14 space-y-1.5">
                  {s.details.map((detail, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm font-body text-muted-foreground/80">
                      <Check size={12} className="text-accent mt-0.5 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Extra features */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center mx-auto mb-3">
                  <Icon size={18} />
                </div>
                <h4 className="font-display text-base font-light text-foreground mb-1">{f.title}</h4>
                <p className="text-muted-foreground font-body text-sm">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CollectionsGrid;
