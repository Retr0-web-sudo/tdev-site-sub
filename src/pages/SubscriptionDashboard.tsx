import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Package, Pause, Play, X, Edit3, Clock, Truck, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import SubscriptionNav from "@/components/SubscriptionNav";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Subscription = {
  id: string;
  status: string;
  plan_name: string;
  plan_slug: string;
  plan_price: number;
  plan_features: string[];
  next_billing_date: string;
  current_period_end: string;
  created_at: string;
  shipping_address: any;
  style_preferences: any;
};

type SubOrder = {
  id: string;
  status: string;
  items: any[];
  tracking_number: string;
  created_at: string;
  shipped_at: string;
  delivered_at: string;
  plan_name: string;
};

const statusIcons: Record<string, typeof Package> = {
  pending: Clock,
  preparing: Package,
  shipped: Truck,
  delivered: CheckCircle,
};

const statusColors: Record<string, string> = {
  pending: "text-muted-foreground",
  preparing: "text-yellow-500",
  shipped: "text-blue-500",
  delivered: "text-green-500",
};

const SubscriptionDashboard = () => {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [orders, setOrders] = useState<SubOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, ordersRes] = await Promise.all([
        supabase.from("subscriptions").select("*").limit(1),
        supabase.from("subscription_orders").select("*").order("created_at", { ascending: false }),
      ]);
      const sub = subRes.data?.[0];
      if (sub) setSubscription(sub as Subscription);
      if (ordersRes.data) setOrders(ordersRes.data as SubOrder[]);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePause = async () => {
    if (!subscription) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from("subscriptions").update({ status: "paused" } as any).eq("id", subscription.id);
      if (error) throw error;
      toast({ title: "Subscription paused", description: "You can resume anytime." });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    if (!subscription) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from("subscriptions").update({ status: "active" } as any).eq("id", subscription.id);
      if (error) throw error;
      toast({ title: "Subscription resumed!" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription || !confirm("Are you sure you want to cancel? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from("subscriptions").update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      } as any).eq("id", subscription.id);
      if (error) throw error;
      toast({ title: "Subscription cancelled" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const daysUntilNext = subscription?.next_billing_date
    ? Math.max(0, Math.ceil((new Date(subscription.next_billing_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Seo title="My Subscription — TDEV Closet" description="Manage your subscription, view orders, and update your style." path="/subscription/dashboard" />
      <Navbar />

      <main className="section-padding pt-24 md:pt-28 pb-16 sm:pb-20">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm tracking-wider mb-6">
          ← Back to Home
        </Link>

        <div className="flex justify-center mb-8">
          <SubscriptionNav />
        </div>

        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground font-body mb-3">Dashboard</p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-foreground">
            My Subscription
          </h1>
        </motion.div>

        {loading ? (
          <p className="text-muted-foreground text-sm text-center">Loading…</p>
        ) : !subscription ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Package size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="font-display text-xl text-foreground mb-2">No active subscription</h2>
            <p className="text-muted-foreground font-body text-sm mb-6">Pick a plan to start receiving curated clothing monthly.</p>
            <Link
              to="/subscription/plans"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-foreground text-[11px] tracking-[0.15em] uppercase font-body font-medium hover:bg-accent/90 transition-all"
            >
              Browse Plans
            </Link>
          </motion.div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Plan Card */}
            <motion.div
              className="bg-card/50 border border-border/40 rounded-xl p-6 sm:p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-body mb-1">Current Plan</p>
                  <h2 className="font-display text-2xl font-light text-foreground">{subscription.plan_name}</h2>
                </div>
                <div className="text-right">
                  <p className="font-display text-3xl font-light text-foreground">GH¢ {subscription.plan_price}</p>
                  <p className="text-muted-foreground font-body text-xs">/month</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] tracking-wider uppercase font-body font-medium ${
                  subscription.status === "active" ? "bg-green-500/10 text-green-500" :
                  subscription.status === "paused" ? "bg-yellow-500/10 text-yellow-500" :
                  "bg-red-500/10 text-red-500"
                }`}>
                  {subscription.status === "active" ? <Play size={10} /> : subscription.status === "paused" ? <Pause size={10} /> : <X size={10} />}
                  {subscription.status}
                </span>
              </div>

              {daysUntilNext !== null && subscription.status === "active" && (
                <div className="bg-secondary/30 rounded-lg p-4 mb-6">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body mb-1">Next box ships in</p>
                  <p className="font-display text-2xl text-foreground">{daysUntilNext} {daysUntilNext === 1 ? "day" : "days"}</p>
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                {subscription.status === "active" && (
                  <button
                    onClick={handlePause}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] tracking-[0.12em] uppercase font-body font-medium border border-border/40 text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all"
                  >
                    <Pause size={12} /> Pause
                  </button>
                )}
                {subscription.status === "paused" && (
                  <button
                    onClick={handleResume}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] tracking-[0.12em] uppercase font-body font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-all"
                  >
                    <Play size={12} /> Resume
                  </button>
                )}
                {subscription.status !== "cancelled" && (
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] tracking-[0.12em] uppercase font-body font-medium border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <X size={12} /> Cancel
                  </button>
                )}
                <Link
                  to="/subscription/quiz"
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] tracking-[0.12em] uppercase font-body font-medium border border-border/40 text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all"
                >
                  <Edit3 size={12} /> Edit Style Quiz
                </Link>
              </div>
            </motion.div>

            {/* Order History */}
            <motion.div
              className="bg-card/50 border border-border/40 rounded-xl p-6 sm:p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h3 className="font-display text-lg text-foreground mb-4">Order History</h3>
              {orders.length === 0 ? (
                <p className="text-muted-foreground font-body text-sm">No orders yet. Your first box will appear here once shipped.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const Icon = statusIcons[order.status] || Package;
                    return (
                      <div key={order.id} className="flex items-center gap-4 p-3 bg-secondary/20 rounded-lg">
                        <Icon size={18} className={statusColors[order.status] || "text-muted-foreground"} />
                        <div className="flex-1">
                          <p className="text-sm font-body text-foreground">{order.plan_name || "Subscription Box"}</p>
                          <p className="text-xs font-body text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <span className={`text-[10px] tracking-wider uppercase font-body font-medium ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SubscriptionDashboard;
