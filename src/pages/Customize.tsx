import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import AnnouncementBar from "@/components/AnnouncementBar";
import Footer from "@/components/Footer";
import ShirtCanvas from "@/components/customizer/ShirtCanvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle, Shirt, Palette } from "lucide-react";
import { toast } from "sonner";

const SHIRT_COLORS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Black", value: "#1a1a1a" },
  { name: "Navy", value: "#1B2A4A" },
  { name: "Red", value: "#B91C1C" },
  { name: "Forest", value: "#166534" },
  { name: "Gold", value: "#D4A843" },
  { name: "Gray", value: "#6B7280" },
  { name: "Cream", value: "#F5F0E8" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

const Customize = () => {
  const [shirtColor, setShirtColor] = useState("#FFFFFF");
  const [shirtSize, setShirtSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Please fill in your name and email");
      return;
    }

    setSending(true);
    let designImageUrl = "";

    try {
      // Export canvas to image
      if (canvasRef.current) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvasRef.current?.toBlob(resolve, "image/png")
        );
        if (blob && blob.size > 100) {
          const fileName = `design-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("custom-designs")
            .upload(fileName, blob, { contentType: "image/png" });

          if (!uploadError && uploadData) {
            const { data: urlData } = supabase.storage.from("custom-designs").getPublicUrl(uploadData.path);
            designImageUrl = urlData.publicUrl;
          }
        }
      }

      const { error } = await supabase.from("custom_design_requests").insert([{
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        shirt_color: shirtColor,
        shirt_size: shirtSize,
        design_image_url: designImageUrl || null,
        notes: form.notes.trim() || null,
        quantity,
      }]);

      if (error) throw error;
      setSent(true);
    } catch {
      toast.error("Failed to submit design request");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />
      <section className="section-padding py-16 md:py-24">
        <motion.div
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h1 className="font-display text-3xl md:text-5xl font-light mb-3">
              <Shirt className="inline mr-3 mb-1" size={36} />
              Design Your Shirt
            </h1>
            <p className="font-body text-sm text-muted-foreground max-w-xl mx-auto">
              Draw, scribble, and add text to create your custom shirt. Submit your design and we'll get back to you with a quote.
            </p>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 border border-border rounded-lg bg-card max-w-lg mx-auto"
            >
              <CheckCircle className="mx-auto mb-4 text-accent" size={56} />
              <h2 className="font-display text-2xl mb-2">Design Submitted!</h2>
              <p className="font-body text-sm text-muted-foreground mb-6">
                We'll review your design and send you a quote via email.
              </p>
              <Button variant="outline" onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", notes: "" }); }}>
                Create Another Design
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left: Canvas */}
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-xl font-light mb-4 flex items-center gap-2">
                      <Palette size={20} /> Customize
                    </h2>

                    {/* Shirt color picker */}
                    <div className="mb-4">
                      <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground mb-2 block">
                        Shirt Color
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {SHIRT_COLORS.map((c) => (
                          <button
                            type="button"
                            key={c.value}
                            onClick={() => setShirtColor(c.value)}
                            aria-label={`Select shirt color ${c.name}`}
                            aria-pressed={shirtColor === c.value}
                            className={`w-9 h-9 rounded-full border-2 transition-transform ${
                              shirtColor === c.value ? "border-accent scale-110" : "border-border"
                            }`}
                            style={{ backgroundColor: c.value }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Size */}
                    <div className="mb-4">
                      <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground mb-2 block">
                        Size
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {SIZES.map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setShirtSize(s)}
                            className={`px-3 py-1.5 rounded border font-body text-xs transition-colors ${
                              shirtSize === s
                                ? "bg-accent text-accent-foreground border-accent"
                                : "bg-card border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="mb-6">
                      <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground mb-2 block">
                        Quantity
                      </Label>
                      <Input
                        type="number" min={1} max={100} value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-24 bg-card border-border font-body text-sm"
                      />
                    </div>
                  </div>

                  <ShirtCanvas shirtColor={shirtColor} onCanvasRef={handleCanvasRef} />
                </div>

                {/* Right: Request form */}
                <div className="space-y-5">
                  <h2 className="font-display text-xl font-light mb-4">Request a Quote</h2>

                  <div>
                    <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                      maxLength={200}
                      className="mt-1 bg-card border-border font-body text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Email *</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@email.com"
                      maxLength={255}
                      className="mt-1 bg-card border-border font-body text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Phone (optional)</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 234 567 890"
                      maxLength={30}
                      className="mt-1 bg-card border-border font-body text-sm"
                    />
                  </div>
                  <div>
                    <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Additional Notes</Label>
                    <Textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Any special requests, placement preferences, etc..."
                      maxLength={2000}
                      rows={4}
                      className="mt-1 bg-card border-border font-body text-sm resize-none"
                    />
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-card border border-border rounded-lg space-y-2">
                    <h3 className="font-body text-xs tracking-wider uppercase text-muted-foreground">Summary</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: shirtColor }} />
                      <span className="font-body text-sm">
                        {SHIRT_COLORS.find((c) => c.value === shirtColor)?.name || "Custom"} · Size {shirtSize} · Qty {quantity}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-body text-xs tracking-wider"
                  >
                    <Send size={14} className="mr-2" />
                    {sending ? "Submitting..." : "Submit Design Request"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </section>
      <Footer />
    </div>
  );
};

export default Customize;
