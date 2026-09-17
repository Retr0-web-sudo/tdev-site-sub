import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { CreditCard, Smartphone, Building, ArrowLeft, Check, Loader2, Package } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/lib/currency";

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
};

type QuizData = {
  sizes: Record<string, string>;
  preferred_colors: string[];
  preferred_styles: string[];
  occasions: string[];
  notes: string;
};

const PAYMENT_METHODS = [
  { id: "momo", label: "Mobile Money", icon: Smartphone, desc: "MTN MoMo, Vodafone Cash, AirtelTigo" },
  { id: "card", label: "Debit Card", icon: CreditCard, desc: "Visa, Mastercard" },
  { id: "bank", label: "Bank Transfer", icon: Building, desc: "Direct bank transfer" },
];

const SubscriptionCheckout = () => {
  const { format, currency: activeCurrency } = useCurrency();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const planId = searchParams.get("plan");

  const [plan, setPlan] = useState<Plan | null>(null);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [step, setStep] = useState<"shipping" | "payment" | "confirm">("shipping");

  const [shipping, setShipping] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    region: "",
    notes: "",
  });

  useEffect(() => {
    if (!planId) {
      navigate("/subscription/plans");
      return;
    }
    const fetchData = async () => {
      const [planRes, quizRes] = await Promise.all([
        supabase.from("subscription_plans").select("*").eq("id", planId).single(),
        supabase.from("style_quizzes").select("*").order("created_at", { ascending: false }).limit(1),
      ]);
      if (planRes.data) setPlan(planRes.data as Plan);
      if (quizRes.data?.[0]) setQuiz(quizRes.data[0] as QuizData);
      setLoading(false);
    };
    fetchData();
  }, [planId, navigate]);

  const handleSubmit = async () => {
    if (!plan || !user) return;
    setSubmitting(true);
    try {
      const { data: subData, error: subError } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        plan_id: plan.id,
        status: "active",
        shipping_address: shipping,
        style_preferences: quiz ? {
          sizes: quiz.sizes,
          colors: quiz.preferred_colors,
          styles: quiz.preferred_styles,
          occasions: quiz.occasions,
        } : {},
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any).select().single();

      if (subError) throw subError;

      // Record payment
      await supabase.from("subscription_payments").insert({
        subscription_id: subData.id,
        user_id: user.id,
        amount: plan.price,
        currency: activeCurrency.code,
        payment_method: paymentMethod,
        status: "succeeded",
        transaction_id: `txn_${Date.now()}`,
        paid_at: new Date().toISOString(),
      } as any);

      // Create first order
      await supabase.from("subscription_orders").insert({
        subscription_id: subData.id,
        user_id: user.id,
        status: "pending",
        items: [],
        amount: plan.price,
        shipping_address: shipping,
      } as any);

      toast({
        title: "Welcome to TDEV Closet!",
        description: `Your ${plan.name} subscription is now active. Your first box is being curated.`,
      });
      navigate("/subscription/dashboard");
    } catch (err: any) {
      toast({ title: "Subscription failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="section-padding pt-24 flex items-center justify-center">
          <Loader2 className="animate-spin text-accent" size={24} />
        </main>
      </div>
    );
  }

  if (!plan) return null;

  const steps = ["shipping", "payment", "confirm"] as const;
  const stepIdx = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Checkout — TDEV Closet" description="Complete your subscription setup." path="/subscription/checkout" />
      <Navbar />

      <main className="section-padding pt-24 md:pt-28 pb-16 sm:pb-20">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm tracking-wider mb-6">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="max-w-4xl mx-auto">
          <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground font-body mb-3">Checkout</p>
            <h1 className="font-display text-3xl sm:text-4xl font-light text-foreground">Complete Your Subscription</h1>
          </motion.div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-body font-medium ${
                  i <= stepIdx ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
                }`}>
                  {i < stepIdx ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-xs font-body tracking-wider capitalize ${i <= stepIdx ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                {i < steps.length - 1 && <div className={`w-12 h-px ${i < stepIdx ? "bg-accent" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2">
              {step === "shipping" && (
                <motion.div className="bg-card/50 border border-border/40 rounded-xl p-6 sm:p-8" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="font-display text-xl font-light text-foreground mb-6">Shipping Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body mb-1.5 block">Full Name</label>
                      <input value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} className="w-full bg-secondary/50 border border-border/40 rounded-lg px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors" placeholder="Kofi Mensah" />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body mb-1.5 block">Phone Number</label>
                      <input value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} className="w-full bg-secondary/50 border border-border/40 rounded-lg px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors" placeholder="+233 24 000 0000" />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body mb-1.5 block">Delivery Address</label>
                      <input value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} className="w-full bg-secondary/50 border border-border/40 rounded-lg px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors" placeholder="123 Osu Oxford St, Accra" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body mb-1.5 block">City</label>
                        <input value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} className="w-full bg-secondary/50 border border-border/40 rounded-lg px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors" placeholder="Accra" />
                      </div>
                      <div>
                        <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body mb-1.5 block">Region</label>
                        <input value={shipping.region} onChange={(e) => setShipping({ ...shipping, region: e.target.value })} className="w-full bg-secondary/50 border border-border/40 rounded-lg px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors" placeholder="Greater Accra" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body mb-1.5 block">Delivery Notes (Optional)</label>
                      <textarea value={shipping.notes} onChange={(e) => setShipping({ ...shipping, notes: e.target.value })} className="w-full h-20 bg-secondary/50 border border-border/40 rounded-lg px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors resize-none" placeholder="Gate code, landmarks..." />
                    </div>
                  </div>
                  <button onClick={() => setStep("payment")} disabled={!shipping.fullName || !shipping.phone || !shipping.address || !shipping.city} className="mt-6 w-full py-3 rounded-full bg-accent text-accent-foreground text-[11px] tracking-[0.15em] uppercase font-body font-medium hover:bg-accent/90 transition-all disabled:opacity-40 disabled:pointer-events-none">
                    Continue to Payment
                  </button>
                </motion.div>
              )}

              {step === "payment" && (
                <motion.div className="bg-card/50 border border-border/40 rounded-xl p-6 sm:p-8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="font-display text-xl font-light text-foreground mb-6">Payment Method</h2>
                  <div className="space-y-3 mb-6">
                    {PAYMENT_METHODS.map((m) => {
                      const Icon = m.icon;
                      return (
                        <button key={m.id} onClick={() => setPaymentMethod(m.id)} className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                          paymentMethod === m.id ? "border-accent bg-accent/5" : "border-border/40 hover:border-accent/30"
                        }`}>
                          <Icon size={20} className={paymentMethod === m.id ? "text-accent" : "text-muted-foreground"} />
                          <div className="text-left">
                            <p className="text-sm font-body font-medium text-foreground">{m.label}</p>
                            <p className="text-xs font-body text-muted-foreground">{m.desc}</p>
                          </div>
                          <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === m.id ? "border-accent" : "border-border"
                          }`}>
                            {paymentMethod === m.id && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep("shipping")} className="flex-1 py-3 rounded-full border border-border/40 text-muted-foreground text-[11px] tracking-[0.15em] uppercase font-body font-medium hover:border-accent/40 transition-all">
                      Back
                    </button>
                    <button onClick={() => setStep("confirm")} className="flex-1 py-3 rounded-full bg-accent text-accent-foreground text-[11px] tracking-[0.15em] uppercase font-body font-medium hover:bg-accent/90 transition-all">
                      Review Order
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "confirm" && (
                <motion.div className="bg-card/50 border border-border/40 rounded-xl p-6 sm:p-8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="font-display text-xl font-light text-foreground mb-6">Confirm & Subscribe</h2>

                  <div className="space-y-4 mb-6">
                    <div className="bg-secondary/30 rounded-lg p-4">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body mb-2">Shipping to</p>
                      <p className="text-sm font-body text-foreground">{shipping.fullName}</p>
                      <p className="text-sm font-body text-foreground/70">{shipping.address}, {shipping.city}, {shipping.region}</p>
                      <p className="text-sm font-body text-foreground/70">{shipping.phone}</p>
                    </div>

                    <div className="bg-secondary/30 rounded-lg p-4">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body mb-2">Payment</p>
                      <p className="text-sm font-body text-foreground capitalize">{paymentMethod === "momo" ? "Mobile Money" : paymentMethod === "card" ? "Debit Card" : "Bank Transfer"}</p>
                    </div>

                    {quiz && (
                      <div className="bg-secondary/30 rounded-lg p-4">
                        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body mb-2">Style Profile</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(quiz.sizes).filter(([, v]) => v).map(([k, v]) => (
                            <span key={k} className="px-2 py-0.5 bg-card/50 rounded text-[10px] font-body uppercase">{k}: {v}</span>
                          ))}
                          {quiz.preferred_colors.slice(0, 3).map((c) => (
                            <span key={c} className="px-2 py-0.5 bg-card/50 rounded text-[10px] font-body">{c}</span>
                          ))}
                          {quiz.preferred_styles.slice(0, 2).map((s) => (
                            <span key={s} className="px-2 py-0.5 bg-card/50 rounded text-[10px] font-body">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep("payment")} className="flex-1 py-3 rounded-full border border-border/40 text-muted-foreground text-[11px] tracking-[0.15em] uppercase font-body font-medium hover:border-accent/40 transition-all">
                      Back
                    </button>
                    <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 rounded-full bg-accent text-accent-foreground text-[11px] tracking-[0.15em] uppercase font-body font-medium hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {submitting ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : "Confirm Subscription"}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card/50 border border-border/40 rounded-xl p-6 sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <Package size={16} className="text-accent" />
                  <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-body">Order Summary</p>
                </div>

                <div className="border-b border-border/30 pb-4 mb-4">
                  <h3 className="font-display text-lg font-light text-foreground">{plan.name}</h3>
                  <p className="text-muted-foreground font-body text-xs mt-1">{plan.item_count_min}–{plan.item_count_max} items curated for you</p>
                </div>

                <div className="space-y-2 mb-4">
                  {(plan.features || []).slice(0, 4).map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs font-body text-foreground/70">
                      <Check size={12} className="text-accent mt-0.5 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <div className="border-t border-border/30 pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-body text-muted-foreground">Monthly</span>
                    <span className="font-display text-2xl font-light text-foreground">{format(plan.price)}</span>
                  </div>
                  <p className="text-[10px] font-body text-muted-foreground/60 mt-1">Cancel anytime. Free delivery included.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SubscriptionCheckout;
