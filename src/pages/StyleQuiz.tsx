import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import SubscriptionNav from "@/components/SubscriptionNav";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const STEPS = ["Sizes", "Colours", "Styles", "Occasions", "Review"];

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

const STYLE_OPTIONS = ["Casual", "Formal", "Streetwear", "Minimalist", "Bohemian", "Athleisure", "Classic", "Edgy"];
const OCCASION_OPTIONS = ["Work", "Weekend", "Party", "Gym", "Date Night", "Travel", "Everyday", "Special Event"];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];

const StyleQuiz = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan");
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [quiz, setQuiz] = useState({
    sizes: { top: "", bottom: "", dress: "", shoe: "" },
    preferredColors: [] as string[],
    preferredStyles: [] as string[],
    occasions: [] as string[],
    notes: "",
  });

  const toggleArrayItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const canNext = () => {
    if (step === 0) return quiz.sizes.top || quiz.sizes.bottom;
    if (step === 1) return quiz.preferredColors.length > 0;
    if (step === 2) return quiz.preferredStyles.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("style_quizzes").insert({
        user_id: (await supabase.auth.getUser()).data.user?.id || "",
        sizes: quiz.sizes,
        preferred_colors: quiz.preferredColors,
        preferred_styles: quiz.preferredStyles,
        occasions: quiz.occasions,
        notes: quiz.notes || null,
        completed_at: new Date().toISOString(),
      } as any);

      if (error) throw error;

      toast({ title: "Style profile saved!", description: "Now pick your outfits for this month's box." });
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

  const [direction, setDirection] = useState(1);

  const goNext = () => { setDirection(1); setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const goBack = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Style Quiz — TDEV Closet" description="Tell us your size, style, and preferences." path="/subscription/quiz" />
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
          <div className="relative overflow-hidden min-h-[320px]">
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
                {step === 0 && (
                  <div>
                    <h2 className="font-display text-2xl font-light text-foreground mb-2">What is your size?</h2>
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

                {step === 1 && (
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

                {step === 2 && (
                  <div>
                    <h2 className="font-display text-2xl font-light text-foreground mb-2">Your style</h2>
                    <p className="text-muted-foreground font-body text-sm mb-6">Select all styles that match your vibe.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {STYLE_OPTIONS.map((style) => {
                        const selected = quiz.preferredStyles.includes(style);
                        return (
                          <button
                            key={style}
                            onClick={() => setQuiz((q) => ({ ...q, preferredStyles: toggleArrayItem(q.preferredStyles, style) }))}
                            className={`px-4 py-3 rounded-lg text-xs font-body font-medium border transition-all duration-200 ${
                              selected ? "bg-accent text-accent-foreground border-accent" : "bg-card/50 text-muted-foreground border-border/40 hover:border-accent/40"
                            }`}
                          >
                            {style}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h2 className="font-display text-2xl font-light text-foreground mb-2">What occasions?</h2>
                    <p className="text-muted-foreground font-body text-sm mb-6">What do you mostly dress for?</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {OCCASION_OPTIONS.map((occ) => {
                        const selected = quiz.occasions.includes(occ);
                        return (
                          <button
                            key={occ}
                            onClick={() => setQuiz((q) => ({ ...q, occasions: toggleArrayItem(q.occasions, occ) }))}
                            className={`px-4 py-3 rounded-lg text-xs font-body font-medium border transition-all duration-200 ${
                              selected ? "bg-accent text-accent-foreground border-accent" : "bg-card/50 text-muted-foreground border-border/40 hover:border-accent/40"
                            }`}
                          >
                            {occ}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h2 className="font-display text-2xl font-light text-foreground mb-2">Anything else?</h2>
                    <p className="text-muted-foreground font-body text-sm mb-6">Add any notes for your stylist — brands you love, fits you prefer, things to avoid.</p>
                    <textarea
                      value={quiz.notes}
                      onChange={(e) => setQuiz((q) => ({ ...q, notes: e.target.value }))}
                      placeholder="e.g. I love oversized fits, never buy neon colours, obsessed with earth tones..."
                      className="w-full h-32 bg-card/50 border border-border/40 rounded-lg px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors resize-none"
                    />
                    <div className="mt-6 p-4 bg-card/30 border border-border/30 rounded-lg">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body mb-2">Your selections</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(quiz.sizes).filter(([, v]) => v).map(([k, v]) => (
                          <span key={k} className="px-2 py-1 bg-secondary/50 rounded text-[10px] font-body uppercase">{k}: {v}</span>
                        ))}
                        {quiz.preferredColors.map((c) => (
                          <span key={c} className="px-2 py-1 bg-secondary/50 rounded text-[10px] font-body">{c}</span>
                        ))}
                        {quiz.preferredStyles.map((s) => (
                          <span key={s} className="px-2 py-1 bg-secondary/50 rounded text-[10px] font-body">{s}</span>
                        ))}
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
                {submitting ? "Saving…" : "Save & Subscribe"}
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
