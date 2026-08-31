import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Announcement {
  id: string;
  title: string;
  message: string;
  link_text: string | null;
  link_url: string | null;
}

const AnnouncementBar = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id, title, message, link_text, link_url")
        .eq("active", true)
        .order("display_order", { ascending: true });
      if (data && data.length > 0) setAnnouncements(data);
    };
    fetch();
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (dismissed || announcements.length === 0) return null;

  const item = announcements[current];

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-accent text-accent-foreground relative z-[60]"
    >
      <div className="section-padding flex items-center justify-center gap-3 py-2 min-h-[36px]">
        {announcements.length > 1 && (
          <button
            onClick={() => setCurrent((current - 1 + announcements.length) % announcements.length)}
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={14} />
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 text-center"
          >
            <span className="font-body text-[10px] md:text-xs tracking-[0.2em] uppercase">
              {item.message}
            </span>
            {item.link_url && (
              <Link
                to={item.link_url}
                className="font-body text-[10px] md:text-xs tracking-wider uppercase underline underline-offset-2 hover:opacity-80 transition-opacity font-medium"
              >
                {item.link_text || "Shop Now"}
              </Link>
            )}
          </motion.div>
        </AnimatePresence>

        {announcements.length > 1 && (
          <button
            onClick={() => setCurrent((current + 1) % announcements.length)}
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={14} />
          </button>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="absolute right-4 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
};

export default AnnouncementBar;
