import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Hero = { title: string; subtitle: string; cta: string };
type Contact = {
  email: string;
  location: string;
  social: {
    instagram: string;
    twitter: string;
    facebook: string;
    tiktok: string;
    youtube: string;
    linkedin: string;
  };
};

const DEFAULT_CONTACT: Contact = {
  email: "hello@tdev.fashion",
  location: "Paris, France",
  social: { instagram: "", twitter: "", facebook: "", tiktok: "", youtube: "", linkedin: "" },
};

const inputCls =
  "mt-1 bg-[hsl(25,15%,12%)] border-[hsl(25,12%,20%)] font-body text-sm";
const labelCls =
  "font-body text-xs tracking-wider uppercase text-[hsl(35,20%,90%)]/60";

const AdminSiteContent = () => {
  const [hero, setHero] = useState<Hero>({ title: "TDEV", subtitle: "Global Collection", cta: "Explore" });
  const [contact, setContact] = useState<Contact>(DEFAULT_CONTACT);
  const [savingHero, setSavingHero] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["hero", "contact"]);

      data?.forEach((row) => {
        if (row.key === "hero" && row.value && typeof row.value === "object" && !Array.isArray(row.value)) {
          setHero(row.value as Hero);
        }
        if (row.key === "contact" && row.value && typeof row.value === "object" && !Array.isArray(row.value)) {
          const v = row.value as Partial<Contact>;
          setContact({
            email: v.email ?? DEFAULT_CONTACT.email,
            location: v.location ?? DEFAULT_CONTACT.location,
            social: { ...DEFAULT_CONTACT.social, ...(v.social ?? {}) },
          });
        }
      });
    })();
  }, []);

  const saveHero = async () => {
    setSavingHero(true);
    const { error } = await supabase.from("site_settings").update({ value: hero as any }).eq("key", "hero");
    setSavingHero(false);
    error ? toast.error("Failed to save") : toast.success("Hero updated!");
  };

  const saveContact = async () => {
    setSavingContact(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "contact", value: contact as any }, { onConflict: "key" });
    setSavingContact(false);
    error ? toast.error("Failed to save contact") : toast.success("Contact updated!");
  };

  const socialFields: { key: keyof Contact["social"]; label: string; placeholder: string }[] = [
    { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourbrand" },
    { key: "twitter", label: "Twitter / X", placeholder: "https://x.com/yourbrand" },
    { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourbrand" },
    { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourbrand" },
    { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourbrand" },
    { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/yourbrand" },
  ];

  return (
    <div className="max-w-2xl space-y-14">
      <div>
        <h2 className="font-display text-2xl font-light mb-1">Site Content</h2>
        <p className="font-body text-sm text-[hsl(35,20%,90%)]/40 mb-8">
          Edit the hero section and main content
        </p>

        <div className="space-y-6">
          <div>
            <Label className={labelCls}>Hero Title</Label>
            <Input value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} className={inputCls} />
          </div>
          <div>
            <Label className={labelCls}>Hero Subtitle</Label>
            <Input value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} className={inputCls} />
          </div>
          <div>
            <Label className={labelCls}>CTA Button Text</Label>
            <Input value={hero.cta} onChange={(e) => setHero({ ...hero, cta: e.target.value })} className={inputCls} />
          </div>

          <Button
            onClick={saveHero}
            disabled={savingHero}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-xs tracking-[0.2em] uppercase"
          >
            {savingHero ? "Saving..." : "Save Hero"}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl font-light mb-1">Contact & Social</h2>
        <p className="font-body text-sm text-[hsl(35,20%,90%)]/40 mb-8">
          Update the contact details and social links shown in the footer. Leave a social field empty to hide its icon.
        </p>

        <div className="space-y-6">
          <div>
            <Label className={labelCls}>Email</Label>
            <Input
              type="email"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              className={inputCls}
              placeholder="hello@yourbrand.com"
            />
          </div>
          <div>
            <Label className={labelCls}>Location</Label>
            <Input
              value={contact.location}
              onChange={(e) => setContact({ ...contact, location: e.target.value })}
              className={inputCls}
              placeholder="Paris, France"
            />
          </div>

          <div className="pt-2">
            <p className="font-body text-xs tracking-[0.2em] uppercase text-[hsl(35,20%,90%)]/50 mb-4">
              Social Media Links
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {socialFields.map((f) => (
                <div key={f.key}>
                  <Label className={labelCls}>{f.label}</Label>
                  <Input
                    type="url"
                    value={contact.social[f.key]}
                    onChange={(e) =>
                      setContact({ ...contact, social: { ...contact.social, [f.key]: e.target.value } })
                    }
                    className={inputCls}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={saveContact}
            disabled={savingContact}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-xs tracking-[0.2em] uppercase"
          >
            {savingContact ? "Saving..." : "Save Contact"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSiteContent;
