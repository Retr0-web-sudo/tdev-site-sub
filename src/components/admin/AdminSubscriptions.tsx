import { useState, useEffect } from "react";
import { RefreshCw, Users, DollarSign, TrendingUp, Pause, Play, X, Eye } from "lucide-react";

const API = "";

interface SubPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  features: string[];
  is_active: boolean;
  display_order: number;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  shipping_address: any;
  style_preferences: any;
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string;
  cancelled_at: string | null;
  created_at: string;
  plan_name: string;
  plan_price: number;
  display_name: string;
  email: string;
}

interface Stats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  planBreakdown: { name: string; count: number }[];
  totalRevenue: number;
}

const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-400 border border-green-500/20",
  paused: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
  cancelled: "bg-red-500/15 text-red-400 border border-red-500/20",
};

const AdminSubscriptions = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<SubPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [activeView, setActiveView] = useState<"overview" | "subscriptions" | "plans">("overview");

  const authHeaders = () => {
    const token = localStorage.getItem("tdev_token");
    return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, subsRes, plansRes] = await Promise.all([
        fetch(`${API}/api/admin/subscription-stats`, { headers: authHeaders() }),
        fetch(`${API}/api/admin/subscriptions`, { headers: authHeaders() }),
        fetch(`${API}/api/subscription-plans`),
      ]);
      const statsData = await statsRes.json();
      const subsData = await subsRes.json();
      const plansData = await plansRes.json();
      if (statsData.success) setStats(statsData.data);
      if (subsData.success) setSubs(subsData.data);
      if (plansData.success) setPlans(plansData.data);
    } catch (err) {
      console.error("Failed to fetch subscription data:", err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateSubStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API}/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setSubs(prev => prev.map(s => s.id === id ? { ...s, status } : s));
        setSelectedSub(prev => prev && prev.id === id ? { ...prev, status } : prev);
      }
    } catch (err) {
      console.error("Failed to update subscription:", err);
    }
  };

  const togglePlanActive = async (plan: SubPlan) => {
    try {
      const res = await fetch(`${API}/api/subscription-plans/${plan.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: !plan.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p));
      }
    } catch (err) {
      console.error("Failed to toggle plan:", err);
    }
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const formatCedi = (n: number) => `GH\u20B5${n.toFixed(2)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin text-muted-foreground" size={20} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-light">Subscriptions</h2>
          <p className="font-body text-sm text-muted-foreground mt-1">Manage subscription plans, subscribers, and billing.</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded-md font-body text-xs tracking-wider text-foreground transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {(["overview", "subscriptions", "plans"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={`px-4 py-2 rounded-t-md font-body text-xs tracking-wider capitalize transition-colors ${
              activeView === v
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeView === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2"><Users size={16} className="text-muted-foreground" /><span className="font-body text-xs text-muted-foreground tracking-wider">Total Subscribers</span></div>
            <p className="font-display text-3xl font-light text-foreground">{stats?.totalSubscriptions || 0}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-green-400" /><span className="font-body text-xs text-muted-foreground tracking-wider">Active</span></div>
            <p className="font-display text-3xl font-light text-green-400">{stats?.activeSubscriptions || 0}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-accent" /><span className="font-body text-xs text-muted-foreground tracking-wider">Total Revenue</span></div>
            <p className="font-display text-3xl font-light text-foreground">{formatCedi(stats?.totalRevenue || 0)}</p>
          </div>

          {/* Plan breakdown */}
          <div className="md:col-span-3 bg-card border border-border rounded-lg p-5">
            <h3 className="font-body text-sm tracking-wider text-muted-foreground mb-4">Plan Breakdown</h3>
            <div className="grid grid-cols-3 gap-4">
              {stats?.planBreakdown?.map((p) => (
                <div key={p.name} className="text-center">
                  <p className="font-display text-2xl font-light text-foreground">{p.count}</p>
                  <p className="font-body text-xs text-muted-foreground">{p.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions list */}
      {activeView === "subscriptions" && (
        <div>
          {subs.length === 0 ? (
            <div className="text-center py-16">
              <Users size={40} className="mx-auto mb-4 text-muted-foreground/40" />
              <p className="font-body text-sm text-muted-foreground">No subscriptions yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subs.map((sub) => (
                <div key={sub.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-accent/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-body text-sm text-foreground">{sub.display_name || sub.email || sub.user_id.slice(0, 8)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-body tracking-wider uppercase ${statusColors[sub.status] || "bg-secondary text-muted-foreground border border-border"}`}>
                        {sub.status}
                      </span>
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      {sub.plan_name} ({formatCedi(sub.plan_price)}) · Started {formatDate(sub.created_at)} · Renews {formatDate(sub.next_billing_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedSub(sub)} className="p-2 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground" title="View">
                      <Eye size={14} />
                    </button>
                    {sub.status === "active" && (
                      <button onClick={() => updateSubStatus(sub.id, "paused")} className="p-2 hover:bg-yellow-500/10 text-yellow-400 rounded-md transition-colors" title="Pause">
                        <Pause size={14} />
                      </button>
                    )}
                    {sub.status === "paused" && (
                      <button onClick={() => updateSubStatus(sub.id, "active")} className="p-2 hover:bg-green-500/10 text-green-400 rounded-md transition-colors" title="Resume">
                        <Play size={14} />
                      </button>
                    )}
                    {sub.status !== "cancelled" && (
                      <button onClick={() => updateSubStatus(sub.id, "cancelled")} className="p-2 hover:bg-red-500/10 text-red-400 rounded-md transition-colors" title="Cancel">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plans */}
      {activeView === "plans" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-card border rounded-lg p-5 ${plan.is_active ? "border-border" : "border-border/50 opacity-60"}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-xl font-light text-foreground">{plan.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-body tracking-wider ${plan.is_active ? "bg-green-500/15 text-green-400 border border-green-500/20" : "bg-secondary text-muted-foreground border border-border"}`}>
                  {plan.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="font-display text-3xl font-light text-foreground mb-3">{formatCedi(plan.price)}<span className="text-sm text-muted-foreground">/mo</span></p>
              <ul className="space-y-1 mb-4">
                {plan.features?.map((f: string, i: number) => (
                  <li key={i} className="font-body text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-accent mt-0.5">·</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => togglePlanActive(plan)}
                className={`w-full py-2 rounded-md font-body text-xs tracking-wider transition-colors ${
                  plan.is_active
                    ? "bg-secondary hover:bg-secondary/80 text-foreground border border-border"
                    : "bg-accent hover:bg-accent/90 text-accent-foreground"
                }`}
              >
                {plan.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedSub(null)}>
          <div className="bg-popover border border-border rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-light text-foreground">Subscription Details</h3>
              <button onClick={() => setSelectedSub(null)} className="p-1 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-3 font-body text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subscriber</span><span className="text-foreground">{selectedSub.display_name || selectedSub.email || selectedSub.user_id}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="text-foreground">{selectedSub.plan_name} ({formatCedi(selectedSub.plan_price)}/mo)</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Status</span><span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${statusColors[selectedSub.status]}`}>{selectedSub.status}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span className="text-foreground">{formatDate(selectedSub.created_at)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Period End</span><span className="text-foreground">{formatDate(selectedSub.current_period_end)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Next Billing</span><span className="text-foreground">{formatDate(selectedSub.next_billing_date)}</span></div>
              {selectedSub.cancelled_at && (
                <div className="flex justify-between"><span className="text-muted-foreground">Cancelled</span><span className="text-red-400">{formatDate(selectedSub.cancelled_at)}</span></div>
              )}

              {selectedSub.shipping_address && Object.keys(selectedSub.shipping_address).length > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-muted-foreground mb-2">Shipping Address</p>
                  <pre className="text-xs text-foreground/80 whitespace-pre-wrap">{JSON.stringify(selectedSub.shipping_address, null, 2)}</pre>
                </div>
              )}

              {selectedSub.style_preferences && Object.keys(selectedSub.style_preferences).length > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-muted-foreground mb-2">Style Preferences</p>
                  <pre className="text-xs text-foreground/80 whitespace-pre-wrap">{JSON.stringify(selectedSub.style_preferences, null, 2)}</pre>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedSub.status === "active" && (
                  <button onClick={() => updateSubStatus(selectedSub.id, "paused")} className="flex-1 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-md font-body text-xs tracking-wider hover:bg-yellow-500/20 transition-colors">Pause</button>
                )}
                {selectedSub.status === "paused" && (
                  <button onClick={() => updateSubStatus(selectedSub.id, "active")} className="flex-1 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md font-body text-xs tracking-wider hover:bg-green-500/20 transition-colors">Resume</button>
                )}
                {selectedSub.status !== "cancelled" && (
                  <button onClick={() => updateSubStatus(selectedSub.id, "cancelled")} className="flex-1 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md font-body text-xs tracking-wider hover:bg-red-500/20 transition-colors">Cancel</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptions;
