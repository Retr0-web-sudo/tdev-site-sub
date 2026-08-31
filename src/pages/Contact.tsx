import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import AnnouncementBar from "@/components/AnnouncementBar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Seo from "@/components/Seo";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast.error("Please fill all fields");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("messages").insert([{
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    }]);
    setSending(false);
    if (error) {
      toast.error("Failed to send message");
    } else {
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Contact TDEV — Get in Touch" description="Have a question, partnership, or press inquiry? Reach the TDEV team here." path="/contact" />
      <AnnouncementBar />
      <Navbar />
      <section className="section-padding py-20 md:py-28">
        <motion.div
          className="max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-3xl md:text-4xl font-light mb-2">Get in Touch</h1>
          <p className="font-body text-sm text-muted-foreground mb-10">
            Have a question or feedback? We'd love to hear from you.
          </p>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 border border-border rounded-lg bg-card"
            >
              <CheckCircle className="mx-auto mb-4 text-accent" size={48} />
              <h2 className="font-display text-xl mb-2">Message Sent!</h2>
              <p className="font-body text-sm text-muted-foreground mb-6">We'll get back to you soon.</p>
              <Button variant="outline" onClick={() => setSent(false)}>Send Another</Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Name</Label>
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
                  <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Email</Label>
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
              </div>
              <div>
                <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Subject</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="What's this about?"
                  maxLength={300}
                  className="mt-1 bg-card border-border font-body text-sm"
                  required
                />
              </div>
              <div>
                <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Message</Label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Your message..."
                  maxLength={5000}
                  rows={6}
                  className="mt-1 bg-card border-border font-body text-sm resize-none"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={sending}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-body text-xs tracking-wider"
              >
                <Send size={14} className="mr-2" />
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          )}
        </motion.div>
      </section>
      <Footer />
    </div>
  );
};

export default Contact;
