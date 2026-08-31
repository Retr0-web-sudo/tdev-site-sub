import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles, Crown, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import SubscriptionNav from "@/components/SubscriptionNav";
import { supabase } from "@/integrations/supabase/client";

type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  item_count_min: number;
  item_count_max: number;
  display_order: number;
};

const planIcons: Record<string, typeof Sparkles> = {
  essentials: Sparkles,
  premium: Star,
  luxe: Crown,
};

const planAccents: Record<string, string> = {
  essentials: "border-border/40 hover:border-accent/40",
  premium: "border-accent/60 shadow-lg shadow-accent/5",
  luxe: "border-accent/30",
};

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase.from("subscription_plans").select("*").order("display_order", { ascending: true });
      if (data) setPlans(data as Plan[]);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Subscription Plans — TDEV Closet"
        description="Choose your monthly clothing subscription. Essentials, Premium, or Luxe — curated fashion delivered to your door."
        path="/subscription/plans"
      />
      <Navbar />

      <main className="section-padding pt-24 md:pt-28 pb-16 sm:pb-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm tracking-wider mb-6"
        >
          ← Back to Home
        </Link>

        <div className="flex justify-center mb-8">
          <SubscriptionNav />
        </div>

        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground font-body mb-3">
            Choose Your Tier
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-light text-foreground leading-[1.1]">
            Subscribe to the style<br />
            <span className="italic text-accent">you actually want.</span>
          </h1>
          <p className="mt-4 text-muted-foreground font-body text-sm max-w-lg mx-auto">
            Pick a tier. Browse the catalog monthly. Choose outfits you love. We curate the rest and deliver it to your door.
          </p>
        </motion.div>

        {loading ? (
          <p className="text-muted-foreground text-sm text-center">Loading plans…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto">
            {plans.map((plan, i) => {
              const Icon = planIcons[plan.slug] || Sparkles;
              const accent = planAccents[plan.slug] || planAccents.essentials;
              const isFeatured = plan.slug === "premium";

              return (
                <motion.div
                  key={plan.id}
                  className={`relative flex flex-col bg-card/50 border rounded-xl p-6 sm:p-8 transition-all duration-300 ${accent} ${
                    isFeatured ? "md:-mt-4 md:mb-[-16px]" : ""
                  }`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                >
                  {isFeatured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[9px] tracking-[0.15em] uppercase font-body font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <Icon size={18} className="text-accent" />
                    <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-body">
                      {plan.name}
                    </span>
                  </div>

                  <div className="mb-6">
                    <span className="font-display text-4xl font-light text-foreground">
                      GH¢ {plan.price}
                    </span>
                    <span className="text-muted-foreground font-body text-sm ml-1">/month</span>
                  </div>

                  <p className="text-muted-foreground font-body text-sm mb-6">
                    {plan.description}
                  </p>

                  <ul className="space-y-2.5 mb-8 flex-1">
                    {(plan.features || []).map((feature, fi) => (
                      <li key={fi} className="flex items-start gap-2.5 text-sm font-body">
                        <Check size={14} className="text-accent mt-0.5 flex-shrink-0" />
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={`/subscription/quiz?plan=${plan.id}`}
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-full text-[11px] tracking-[0.15em] uppercase font-body font-medium transition-all duration-300 ${
                      isFeatured
                        ? "bg-accent text-accent-foreground hover:bg-accent/90"
                        : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    Choose Plan
                    <ArrowRight size={14} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Comparison Table */}
        <motion.div
          className="mt-20 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground text-center mb-8">
            Compare Plans
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Feature</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Essentials</th>
                  <th className="text-center py-3 px-4 text-accent font-medium">Premium</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Luxe</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Items per month", "2–3", "4–5", "6–8"],
                  ["Free delivery", "✓", "✓", "✓ (Express)"],
                  ["Free returns", "5 days", "5 days", "7 days"],
                  ["Exclusive collections", "—", "✓", "✓"],
                  ["Priority stylist", "—", "✓", "✓"],
                  ["Dedicated stylist", "—", "—", "✓"],
                  ["Designer pieces", "—", "—", "✓"],
                  ["Cancel anytime", "✓", "✓", "✓"],
                ].map(([label, e, p, l], i) => (
                  <tr key={i} className="border-b border-border/20">
                    <td className="py-3 px-4 text-foreground/70">{label}</td>
                    <td className="py-3 px-4 text-center text-foreground/60">{e}</td>
                    <td className="py-3 px-4 text-center text-accent">{p}</td>
                    <td className="py-3 px-4 text-center text-foreground/60">{l}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          className="mt-20 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {[
              { q: "Can I switch plans?", a: "Yes. Upgrade or downgrade anytime from your dashboard. Changes take effect on your next billing cycle." },
              { q: "How do returns work?", a: "Try everything on. Return any items you do not want within 5 days (7 for Luxe) for a free swap." },
              { q: "Can I pause my subscription?", a: "Yes. Pause for up to 3 months. Your stylist profile is saved for when you come back." },
              { q: "What payment methods are accepted?", a: "Mobile Money (MTN MoMo, Vodafone Cash, AirtelTigo), debit cards, and bank transfers." },
            ].map((faq, i) => (
              <details key={i} className="group bg-card/30 border border-border/30 rounded-lg overflow-hidden">
                <summary className="px-5 py-4 cursor-pointer text-sm font-body font-medium text-foreground hover:text-accent transition-colors">
                  {faq.q}
                </summary>
                <div className="px-5 pb-4 text-sm font-body text-muted-foreground">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default SubscriptionPlans;
