import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Check, CheckCheck, Package, CreditCard, Star, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import SubscriptionNav from "@/components/SubscriptionNav";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
};

const typeIcons: Record<string, typeof Bell> = {
  info: Info,
  box_confirmed: Package,
  box_shipped: Package,
  payment: CreditCard,
  upgrade: Star,
  announcement: Bell,
  admin: Bell,
};

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("tdev_token");
    const res = await fetch("/api/notifications", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();
    if (data.success) setNotifications(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id: string) => {
    const token = localStorage.getItem("tdev_token");
    await fetch(`/api/notifications/${id}/read`, {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    const token = localStorage.getItem("tdev_token");
    await fetch("/api/notifications/read-all", {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Notifications — TDEV Closet" description="Stay updated on your subscription and orders." path="/notifications" />
      <Navbar />

      <main className="section-padding pt-24 md:pt-28 pb-16 sm:pb-20">
        <div className="flex justify-center mb-8">
          <SubscriptionNav />
        </div>

        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground font-body mb-3">Notifications</p>
          <h1 className="font-display text-3xl sm:text-4xl font-light text-foreground">Stay Updated</h1>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {unread > 0 && (
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-body text-muted-foreground">{unread} unread</p>
              <button onClick={markAllRead} className="text-xs font-body text-accent hover:text-accent/80 transition-colors flex items-center gap-1">
                <CheckCheck size={14} /> Mark all read
              </button>
            </div>
          )}

          {loading ? (
            <p className="text-muted-foreground text-sm text-center py-16">Loading...</p>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell size={48} className="mx-auto text-muted-foreground/20 mb-4" />
              <h2 className="font-display text-xl text-foreground mb-2">All caught up</h2>
              <p className="text-muted-foreground font-body text-sm">You'll see updates about your subscription, orders, and new arrivals here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif, i) => {
                const Icon = typeIcons[notif.type] || Bell;
                return (
                  <motion.div
                    key={notif.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                      notif.read ? "bg-card/30 border-border/30" : "bg-card/60 border-accent/20"
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => !notif.read && markRead(notif.id)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.read ? "bg-secondary" : "bg-accent/15"}`}>
                      <Icon size={14} className={notif.read ? "text-muted-foreground" : "text-accent"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-body font-medium ${notif.read ? "text-foreground/70" : "text-foreground"}`}>{notif.title}</p>
                      {notif.message && <p className="text-xs font-body text-muted-foreground mt-0.5">{notif.message}</p>}
                      <p className="text-[10px] font-body text-muted-foreground/50 mt-1">{new Date(notif.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-2" />}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Notifications;
