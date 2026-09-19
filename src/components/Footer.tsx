import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, Instagram, Twitter, Facebook, Youtube, Linkedin } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ContactSettings = {
  email: string;
  location: string;
  social: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
  };
};

const DEFAULTS: ContactSettings = {
  email: "hello@tdev.fashion",
  location: "Accra, Ghana",
  social: {},
};

const TikTokIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V9.01a8.16 8.16 0 0 0 4.77 1.52V7.1a4.85 4.85 0 0 1-1.84-.41Z" />
  </svg>
);

const Footer = () => {
  const [contact, setContact] = useState<ContactSettings>(DEFAULTS);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "contact")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
          const v = data.value as Partial<ContactSettings>;
          setContact({
            email: v.email || DEFAULTS.email,
            location: v.location || DEFAULTS.location,
            social: v.social || {},
          });
        }
      });
  }, []);

  const socials: { key: keyof ContactSettings["social"]; label: string; Icon: React.ComponentType<any> }[] = [
    { key: "instagram", label: "Instagram", Icon: Instagram },
    { key: "twitter", label: "Twitter / X", Icon: Twitter },
    { key: "facebook", label: "Facebook", Icon: Facebook },
    { key: "tiktok", label: "TikTok", Icon: TikTokIcon },
    { key: "youtube", label: "YouTube", Icon: Youtube },
    { key: "linkedin", label: "LinkedIn", Icon: Linkedin },
  ];

  const activeSocials = socials.filter((s) => contact.social?.[s.key]);

  return (
    <footer id="contact" className="bg-[hsl(0_0%_7%)] text-white section-padding py-20 md:py-28">
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-8 md:gap-8 max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="col-span-2">
          <img
            src="/logo.png"
            alt="TDEV | Tenue de Ville"
            className="h-10 md:h-12 w-auto rounded-md bg-white object-contain p-0.5 ring-1 ring-black/10 mb-4 sm:mb-5 block transition-all duration-300"
          />
          <p className="font-body text-xs sm:text-sm text-white/50 leading-[1.8] max-w-xs">
            Curated fashion delivered monthly. Sustainable style, chosen for you.
          </p>
        </div>

        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase font-body mb-4 sm:mb-6 text-white/30">Subscribe</p>
          <div className="flex flex-col gap-2 sm:gap-3">
            {[
              { label: "View Plans", href: "/subscription/plans" },
              { label: "Browse Catalog", href: "/catalog" },
              { label: "How It Works", href: "/#how-it-works" },
              { label: "My Dashboard", href: "/subscription/dashboard" },
            ].map((link) => (
              <Link key={link.label} to={link.href} className="group font-body text-xs sm:text-sm text-white/60 hover:text-white transition-colors duration-300 inline-flex items-center gap-1.5 w-fit">
                {link.label}
                <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase font-body mb-4 sm:mb-6 text-white/30">Contact</p>
          <div className="flex flex-col gap-2 sm:gap-3 font-body text-xs sm:text-sm text-white/60">
            <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors duration-300 break-all">{contact.email}</a>
            <span>{contact.location}</span>
          </div>
          {activeSocials.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-5">
              {activeSocials.map(({ key, label, Icon }) => (
                <a key={key} href={contact.social[key]} target="_blank" rel="noopener noreferrer" aria-label={label} className="text-white/50 hover:text-white transition-colors duration-300">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          )}
        </div>
        {/* Legal */}
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase font-body mb-4 sm:mb-6 text-white/30">Legal</p>
          <div className="flex flex-col gap-2 sm:gap-3">
            {[
              { label: "Terms & Conditions", href: "/terms" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Cookie Policy", href: "/cookies" },
            ].map((link) => (
              <Link key={link.label} to={link.href} className="group font-body text-xs sm:text-sm text-white/60 hover:text-white transition-colors duration-300 inline-flex items-center gap-1.5 w-fit">
                {link.label}
                <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="mt-12 sm:mt-20 pt-6 sm:pt-8 border-t border-primary-foreground/8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="font-body text-[10px] sm:text-[11px] text-white/25 tracking-wider text-center sm:text-left">© 2026 TDEV. All rights reserved.</p>
          <Link to="/admin" className="font-body text-[10px] sm:text-[11px] text-white/25 hover:text-white/50 tracking-wider transition-colors">Admin</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
