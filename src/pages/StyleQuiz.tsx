import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Sparkles, Star, Crown, MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import SubscriptionNav from "@/components/SubscriptionNav";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const STEPS = ["Style DNA", "Sizes", "Colours", "Budget", "Lifestyle", "Notes"];

const STYLE_PERSONALITIES = [
  { id: "minimalist", label: "Minimalist", desc: "Clean lines, neutral tones, less is more", emoji: "◯" },
  { id: "streetwear", label: "Streetwear", desc: "Bold logos, relaxed fits, urban edge", emoji: "◆" },
  { id: "classic", label: "Classic", desc: "Timeless pieces, polished, refined", emoji: "□" },
  { id: "bohemian", label: "Bohemian", desc: "Free-spirited, patterns, layered textures", emoji: "△" },
  { id: "athleisure", label: "Athleisure", desc: "Activewear meets everyday comfort", emoji: "◎" },
  { id: "edgy", label: "Edgy", desc: "Dark tones, leather, statement pieces", emoji: "☆" },
];

const COLOR_OPTIONS = [
  { name: "Black", hex: "#1a1a1a" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Navy", hex: "#1a2744" },
  { name: "Beige", hex: "#d4c5a9" },
  { name: "Olive", hex: "#556b2f" },
  { name: "Burgundy", hex: "#722f37" },
  { name: "Grey", hex: "#808080" },
  { name: "Brown", hex: "#6b4423" },
  { name: "Rust", hex: "#b7410e" },
  { name: "Cream", hex: "#fffdd0" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Green", hex: "#16a34a" },
];

const BUDGET_OPTIONS = [
  { id: "budget", label: "Budget-Friendly", range: "$20–40 per item", desc: "Great style doesn't break the bank" },
  { id: "mid", label: "Mid-Range", range: "$40–80 per item", desc: "Quality pieces at fair prices" },
  { id: "premium", label: "Premium", range: "$80–150 per item", desc: "Invest in pieces that last" },
  { id: "luxury", label: "Luxury", range: "$150+ per item", desc: "Only the finest will do" },
];

const LIFESTYLE_OPTIONS = [
  { id: "workwear", label: "Workwear", icon: "💼" },
  { id: "casual", label: "Casual Everyday", icon: "☕" },
  { id: "date-night", label: "Date Night", icon: "🕯" },
  { id: "gym", label: "Gym & Active", icon: "💪" },
  { id: "travel", label: "Travel", icon: "✈" },
  { id: "weekend", label: "Weekend Vibes", icon: "🌴" },
  { id: "party", label: "Party & Going Out", icon: "🎵" },
  { id: "special", label: "Special Events", icon: "✨" },
];

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];

const StyleQuiz = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan");
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [quiz, setQuiz] = useState({
    stylePersonality: [] as string[],
    sizes: { top: "", bottom: "", dress: "", shoe: "" },
    preferredColors: [] as string[],
    budget: "",
    lifestyle: [] as string[],
    notes: "",
  });

  const toggleArrayItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const canNext = () => {
    if (step === 0) return quiz.stylePersonality.length > 0;
    if (step === 1) return quiz.sizes.top || quiz.sizes.bottom;
    if (step === 2) return quiz.preferredColors.length > 0;
    if (step === 3) return quiz.budget !== "";
    return true;
  };

  const getRecommendedPlan = () => {
    if (quiz.budget === "luxury") return { name: "Luxe", slug: "luxe", reason: "Your luxury taste deserves our premium selection" };
    if (quiz.budget === "premium") return { name: "Premium", slug: "premium", reason: "Perfect for building a quality wardrobe" };
    return { name: "Essentials", slug: "essentials", reason: "Great style at an accessible price" };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("style_quizzes").insert({
        user_id: (await supabase.auth.getUser()).data.user?.id || "",
        sizes: quiz.sizes,
        preferred_colors: quiz.preferredColors,
        preferred_styles: quiz.stylePersonality,
        occasions: quiz.lifestyle,
        notes: quiz.notes || null,
        completed_at: new Date().toISOString(),
      } as any);

      if (error) throw error;

      const recommended = getRecommendedPlan();
      toast({
        title: "Style profile saved!",
        description: `We recommend the ${recommended.name} plan. ${recommended.reason}.`,
      });
      navigate(planId ? `/subscription/build-box?plan=${planId}` : "/subscription/plans");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save quiz", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
  };

  const goNext = () => { setDirection(1); setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const goBack = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };

  const recommended = getRecommendedPlan();

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Style Quiz — TDEV" description="Discover your style DNA. Tell us your size, colours, budget and lifestyle so we can curate the perfect box." path="/subscription/quiz" />
      <Navbar />

      <main className="section-padding pt-24 md:pt-28 pb-16 sm:pb-20">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm tracking-wider mb-6">
          ← Back to Home
        </Link>

        <div className="flex justify-center mb-8">
          <SubscriptionNav />
        </div>

        <div className="max-w-xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {STEPS.map((s, i) => (
                <span key={i} className={`text-[10px] tracking-[0.1em] uppercase font-body ${i <= step ? "text-accent" : "text-muted-foreground"}`}>
                  {s}
                </span>
              ))}
            </div>
            <div className="h-0.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent"
                animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="relative overflow-hidden min-h-[360px]">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* Step 0: Style DNA */}
                {step === 0 && (
                  <div>
                    <h2 className="font-display text-2xl font-light text-foreground mb-2">What's your style DNA?</h2>
                    <p className="text-muted-foreground font-body text-sm mb-6">Pick the styles that feel like you. We'll use this to curate your box.</p>
                    <div className="grid grid-cols-2 gap-3">
                      {STYLE_PERSONALITIES.map((style) => {
                        const selected = quiz.stylePersonality.includes(style.id);
                        return (
                          <button
                            key={style.id}
                            onClick={() => setQuiz((q) => ({ ...q, stylePersonality: toggleArrayItem(q.stylePersonality, style.id) }))}
                            className={`text-left p-4 rounded-lg border transition-all duration-200 ${
                              selected ? "border-accent bg-accent/10" : "border-border/30 hover:border-accent/30 bg-card/30"
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-lg">{style.emoji}</span>
                              <span className="font-body text-sm font-medium text-foreground">{style.label}</span>
                              {selected && <Check size={14} className="text-accent ml-auto" />}
                            </div>
                            <p className="font-body text-xs text-muted-foreground">{style.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 1: Sizes */}
                {step === 1 && (
                  <div>
                    <h2 className="font-display text-2xl font-light text-foreground mb-2">What's your size?</h2>
                    <p className="text-muted-foreground font-body text-sm mb-6">Select your typical size for each category.</p>
                    {(["top", "bottom", "dress", "shoe"] as const).map((key) => (
                      <div key={key} className="mb-5">
                        <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body mb-2 block capitalize">
                          {key === "shoe" ? "Shoe Size" : `${key} Size`}
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {SIZE_OPTIONS.map((size) => (
                            <button
                              key={size}
                              onClick={() => setQuiz((q) => ({ ...q, sizes: { ...q.sizes, [key]: size } }))}
                              className={`px-4 py-2 rounded-full text-xs font-body font-medium border transition-all duration-200 ${
                                quiz.sizes[key] === size
                                  ? "bg-accent text-accent-foreground border-accent"
                                  : "bg-card/50 text-muted-foreground border-border/40 hover:border-accent/40"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Step 2: Colours */}
                {step === 2 && (
                  <div>
                    <h2 className="font-display text-2xl font-light text-foreground mb-2">Pick your colours</h2>
                    <p className="text-muted-foreground font-body text-sm mb-6">Select all the colours you love wearing.</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {COLOR_OPTIONS.map((color) => {
                        const selected = quiz.preferredColors.includes(color.name);
                        return (
                          <button
                            key={color.name}
                            onClick={() => setQuiz((q) => ({ ...q, preferredColors: toggleArrayItem(q.preferredColors, color.name) }))}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-200 ${
                              selected ? "border-accent bg-accent/10" : "border-border/30 hover:border-accent/30"
                            }`}
                          >
                            <div
                              className="w-8 h-8 rounded-full border border-border/20"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="text-[10px] tracking-wider uppercase font-body text-foreground/70">{color.name}</span>
                            {selected && <Check size={12} className="text-accent" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3: Budget */}
                {step === 3 && (
                  <div>
                    <h2 className="font-display text-2xl font-light text-foreground mb-2">What's your budget?</h2>
                    <p className="text-muted-foreground font-body text-sm mb-6">Set your comfort zone per item. We'll never exceed it.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {BUDGET_OPTIONS.map((budget) => {
                        const selected = quiz.budget === budget.id;
                        return (
                          <button
                            key={budget.id}
                            onClick={() => setQuiz((q) => ({ ...q, budget: budget.id }))}
                            className={`text-left p-4 rounded-lg border transition-all duration-200 ${
                              selected ? "border-accent bg-accent/10" : "border-border/30 hover:border-accent/30 bg-card/30"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-body text-sm font-medium text-foreground">{budget.label}</span>
                              {selected && <Check size={14} className="text-accent" />}
                            </div>
                            <p className="font-body text-xs text-accent mb-1">{budget.range}</p>
                            <p className="font-body text-xs text-muted-foreground">{budget.desc}</p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Plan Recommendation */}
                    {quiz.budget && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-accent/10 border border-accent/30 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles size={14} className="text-accent" />
                          <span className="font-body text-xs font-medium text-accent">Recommended for you</span>
                        </div>
                        <p className="font-body text-sm text-foreground font-medium">{recommended.name} Plan</p>
                        <p className="font-body text-xs text-muted-foreground">{recommended.reason}</p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Step 4: Lifestyle */}
                {step === 4 && (
                  <div>
                    <h2 className="font-display text-2xl font-light text-foreground mb-2">What's your lifestyle?</h2>
                    <p className="text-muted-foreground font-body text-sm mb-6">What do you mostly dress for? Pick all that apply.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {LIFESTYLE_OPTIONS.map((lifestyle) => {
                        const selected = quiz.lifestyle.includes(lifestyle.id);
                        return (
                          <button
                            key={lifestyle.id}
                            onClick={() => setQuiz((q) => ({ ...q, lifestyle: toggleArrayItem(q.lifestyle, lifestyle.id) }))}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-200 ${
                              selected ? "bg-accent text-accent-foreground border-accent" : "bg-card/50 text-muted-foreground border-border/40 hover:border-accent/40"
                            }`}
                          >
                            <span className="text-xl">{lifestyle.icon}</span>
                            <span className="text-xs font-body font-medium">{lifestyle.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 5: Notes */}
                {step === 5 && (
                  <div>
                    <h2 className="font-display text-2xl font-light text-foreground mb-2">Notes for your stylist</h2>
                    <p className="text-muted-foreground font-body text-sm mb-6">Anything we should know? Brands you love, fits you prefer, things to avoid.</p>

                    <div className="relative mb-4">
                      <MessageSquare size={16} className="absolute top-3 left-3 text-muted-foreground/40" />
                      <textarea
                        value={quiz.notes}
                        onChange={(e) => setQuiz((q) => ({ ...q, notes: e.target.value }))}
                        placeholder="e.g. I love oversized fits, never buy neon colours, obsessed with earth tones... Also love local Ghanaian brands."
                        className="w-full h-32 bg-card/50 border border-border/40 rounded-lg pl-10 pr-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors resize-none"
                      />
                    </div>

                    <div className="p-4 bg-card/30 border border-border/30 rounded-lg">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body mb-2">Your style summary</p>
                      <div className="flex flex-wrap gap-2">
                        {quiz.stylePersonality.map((s) => {
                          const style = STYLE_PERSONALITIES.find((sp) => sp.id === s);
                          return (
                            <span key={s} className="px-2 py-1 bg-secondary/50 rounded text-[10px] font-body">{style?.emoji} {style?.label}</span>
                          );
                        })}
                        {Object.entries(quiz.sizes).filter(([, v]) => v).map(([k, v]) => (
                          <span key={k} className="px-2 py-1 bg-secondary/50 rounded text-[10px] font-body uppercase">{k}: {v}</span>
                        ))}
                        {quiz.preferredColors.map((c) => (
                          <span key={c} className="px-2 py-1 bg-secondary/50 rounded text-[10px] font-body">{c}</span>
                        ))}
                        {quiz.budget && (
                          <span className="px-2 py-1 bg-secondary/50 rounded text-[10px] font-body">{BUDGET_OPTIONS.find((b) => b.id === quiz.budget)?.label}</span>
                        )}
                        {quiz.lifestyle.map((l) => {
                          const lifestyle = LIFESTYLE_OPTIONS.find((lo) => lo.id === l);
                          return (
                            <span key={l} className="px-2 py-1 bg-secondary/50 rounded text-[10px] font-body">{lifestyle?.icon} {lifestyle?.label}</span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={goBack}
              disabled={step === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] tracking-[0.12em] uppercase font-body font-medium border border-border/40 text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={goNext}
                disabled={!canNext()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] tracking-[0.12em] uppercase font-body font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                Next
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] tracking-[0.12em] uppercase font-body font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-all disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save & Start Curating"}
                {!submitting && <ArrowRight size={14} />}
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StyleQuiz;
