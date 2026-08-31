import { useState, useEffect } from "react";
import { RefreshCw, Users, DollarSign, TrendingUp, Pause, Play, X, Eye, Plus, Edit3, Package, ClipboardList, Brain, Truck, CheckCircle, Clock } from "lucide-react";

const API = "";

interface SubPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  features: string[];
  item_count_min: number;
  item_count_max: number;
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

interface SubOrder {
  id: string;
  subscription_id: string;
  user_id: string;
  status: string;
  items: any[];
  amount: number;
  tracking_number: string;
  notes: string;
  created_at: string;
  shipped_at: string;
  delivered_at: string;
  plan_name: string;
  display_name: string;
  email: string;
}

interface Stats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  planBreakdown: { name: string; count: number }[];
  totalRevenue: number;
}

interface Quiz {
  id: string;
  user_id: string;
  sizes: any;
  preferred_colors: string[];
  preferred_styles: string[];
  occasions: string[];
  notes: string;
  completed_at: string;
  display_name: string;
  email: string;
}

const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-400 border border-green-500/20",
  paused: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
  cancelled: "bg-red-500/15 text-red-400 border border-red-500/20",
  pending: "bg-muted text-muted-foreground border border-border",
  preparing: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
  shipped: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  delivered: "bg-green-500/15 text-green-400 border border-green-500/20",
};

const orderStatusIcons: Record<string, typeof Package> = {
  pending: Clock,
  preparing: Package,
  shipped: Truck,
  delivered: CheckCircle,
};

const AdminSubscriptions = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<SubPlan[]>([]);
  const [orders, setOrders] = useState<SubOrder[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SubOrder | null>(null);
  const [activeView, setActiveView] = useState<"overview" | "subscriptions" | "orders" | "plans" | "quizzes">("overview");
  const [editingPlan, setEditingPlan] = useState<SubPlan | null>(null);
  const [planForm, setPlanForm] = useState({ name: "", slug: "", price: "", description: "", features: "", item_count_min: "2", item_count_max: "5", interval: "monthly" });

  const authHeaders = () => {
    const token = localStorage.getItem("tdev_token");
    return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, subsRes, plansRes, ordersRes, quizzesRes] = await Promise.all([
        fetch(`${API}/api/admin/subscription-stats`, { headers: authHeaders() }),
        fetch(`${API}/api/admin/subscriptions`, { headers: authHeaders() }),
        fetch(`${API}/api/subscription-plans`),
        fetch(`${API}/api/admin/subscription-orders`, { headers: authHeaders() }),
        fetch(`${API}/api/admin/style-quizzes`, { headers: authHeaders() }),
      ]);
      const statsD = await statsRes.json();
      const subsD = await subsRes.json();
      const plansD = await plansRes.json();
      const ordersD = await ordersRes.json();
      const quizzesD = await quizzesRes.json();
      if (statsD.success) setStats(statsD.data);
      if (subsD.success) setSubs(subsD.data);
      if (plansD.success) setPlans(plansD.data);
      if (ordersD.success) setOrders(ordersD.data);
      if (quizzesD.success) setQuizzes(quizzesD.data);
    } catch (err) {
      console.error("Failed to fetch subscription data:", err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateSubStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API}/api/subscriptions/${id}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setSubs(prev => prev.map(s => s.id === id ? { ...s, status } : s));
        setSelectedSub(prev => prev && prev.id === id ? { ...prev, status } : prev);
      }
    } catch (err) { console.error("Failed to update subscription:", err); }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API}/api/admin/subscription-orders/${id}`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        setSelectedOrder(prev => prev && prev.id === id ? { ...prev, status } : prev);
      }
    } catch (err) { console.error("Failed to update order:", err); }
  };

  const savePlan = async () => {
    const payload = {
      name: planForm.name, slug: planForm.slug, price: parseFloat(planForm.price) || 0,
      description: planForm.description, features: planForm.features.split("\n").filter(Boolean),
      item_count_min: parseInt(planForm.item_count_min) || 2, item_count_max: parseInt(planForm.item_count_max) || 5,
      interval: planForm.interval,
    };
    try {
      const url = editingPlan ? `${API}/api/admin/subscription-plans/${editingPlan.id}` : `${API}/api/admin/subscription-plans`;
      const method = editingPlan ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        setEditingPlan(null);
        setPlanForm({ name: "", slug: "", price: "", description: "", features: "", item_count_min: "2", item_count_max: "5", interval: "monthly" });
        fetchData();
      }
    } catch (err) { console.error("Failed to save plan:", err); }
  };

  const startEditPlan = (plan: SubPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name, slug: plan.slug, price: String(plan.price),
      description: plan.description || "", features: (plan.features || []).join("\n"),
      item_count_min: String(plan.item_count_min || 2), item_count_max: String(plan.item_count_max || 5),
      interval: "monthly",
    });
    setActiveView("plans");
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const formatCedi = (n: number) => `GH\u20B5${Number(n || 0).toFixed(2)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin text-muted-foreground/40" size={20} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-light">Subscriptions</h2>
          <p className="font-body text-sm text-muted-foreground mt-1">Manage plans, subscribers, orders, and style quizzes.</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md font-body text-xs tracking-wider transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {([
          { id: "overview", label: "Overview", icon: TrendingUp },
          { id: "subscriptions", label: "Subscribers", icon: Users },
          { id: "orders", label: "Orders", icon: ClipboardList },
          { id: "plans", label: "Plans", icon: Package },
          { id: "quizzes", label: "Style Quizzes", icon: Brain },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveView(id)} className={`flex items-center gap-2 px-4 py-2 rounded-t-md font-body text-xs tracking-wider whitespace-nowrap transition-colors ${
            activeView === id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeView === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2"><Users size={16} className="text-muted-foreground" /><span className="font-body text-xs text-muted-foreground tracking-wider">Total Subscribers</span></div>
            <p className="font-display text-3xl font-light">{stats?.totalSubscriptions || 0}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-green-400/60" /><span className="font-body text-xs text-muted-foreground tracking-wider">Active</span></div>
            <p className="font-display text-3xl font-light text-green-400">{stats?.activeSubscriptions || 0}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-accent" /><span className="font-body text-xs text-muted-foreground tracking-wider">Revenue</span></div>
            <p className="font-display text-3xl font-light">{formatCedi(stats?.totalRevenue || 0)}</p>
          </div>
          <div className="md:col-span-3 bg-card border border-border rounded-lg p-5">
            <h3 className="font-body text-sm tracking-wider text-muted-foreground mb-4">Plan Breakdown</h3>
            <div className="grid grid-cols-3 gap-4">
              {stats?.planBreakdown?.map((p) => (
                <div key={p.name} className="text-center">
                  <p className="font-display text-2xl font-light">{p.count}</p>
                  <p className="font-body text-xs text-muted-foreground">{p.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subscribers */}
      {activeView === "subscriptions" && (
        <div className="space-y-2">
          {subs.length === 0 ? (
            <div className="text-center py-16"><Users size={40} className="mx-auto mb-4 text-muted-foreground/20" /><p className="font-body text-sm text-muted-foreground">No subscribers yet.</p></div>
          ) : subs.map((sub) => (
            <div key={sub.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-accent/20 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-body text-sm text-foreground">{sub.display_name || sub.email || sub.user_id.slice(0, 8)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-body tracking-wider uppercase ${statusColors[sub.status] || ""}`}>{sub.status}</span>
                </div>
                <p className="font-body text-xs text-muted-foreground mt-1">{sub.plan_name} ({formatCedi(sub.plan_price)}) · Started {formatDate(sub.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedSub(sub)} className="p-2 hover:bg-secondary rounded-md transition-colors" title="View"><Eye size={14} /></button>
                {sub.status === "active" && <button onClick={() => updateSubStatus(sub.id, "paused")} className="p-2 hover:bg-yellow-500/10 text-yellow-400 rounded-md transition-colors" title="Pause"><Pause size={14} /></button>}
                {sub.status === "paused" && <button onClick={() => updateSubStatus(sub.id, "active")} className="p-2 hover:bg-green-500/10 text-green-400 rounded-md transition-colors" title="Resume"><Play size={14} /></button>}
                {sub.status !== "cancelled" && <button onClick={() => updateSubStatus(sub.id, "cancelled")} className="p-2 hover:bg-red-500/10 text-red-400 rounded-md transition-colors" title="Cancel"><X size={14} /></button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Orders */}
      {activeView === "orders" && (
        <div className="space-y-2">
          {orders.length === 0 ? (
            <div className="text-center py-16"><ClipboardList size={40} className="mx-auto mb-4 text-muted-foreground/20" /><p className="font-body text-sm text-muted-foreground">No orders yet.</p></div>
          ) : orders.map((order) => {
            const Icon = orderStatusIcons[order.status] || Package;
            return (
              <div key={order.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-accent/20 transition-colors">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Icon size={18} className={statusColors[order.status]?.split(" ")[1] || "text-muted-foreground"} />
                  <div>
                    <p className="text-sm font-body text-foreground">{order.display_name || order.email || "Subscriber"}</p>
                    <p className="text-xs font-body text-muted-foreground">{order.plan_name} · {formatDate(order.created_at)} · {formatCedi(order.amount)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-body tracking-wider uppercase ${statusColors[order.status] || ""}`}>{order.status}</span>
                  <button onClick={() => setSelectedOrder(order)} className="p-2 hover:bg-secondary rounded-md transition-colors"><Eye size={14} /></button>
                  {order.status === "pending" && <button onClick={() => updateOrderStatus(order.id, "preparing")} className="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded text-[10px] font-body tracking-wider hover:bg-yellow-500/20 transition-colors">Prepare</button>}
                  {order.status === "preparing" && <button onClick={() => updateOrderStatus(order.id, "shipped")} className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-[10px] font-body tracking-wider hover:bg-blue-500/20 transition-colors">Ship</button>}
                  {order.status === "shipped" && <button onClick={() => updateOrderStatus(order.id, "delivered")} className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-[10px] font-body tracking-wider hover:bg-green-500/20 transition-colors">Deliver</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plans */}
      {activeView === "plans" && (
        <div>
          {/* Edit/Create Form */}
          <div className="bg-card border border-border rounded-lg p-5 mb-6">
            <h3 className="font-body text-sm tracking-wider text-foreground mb-4">{editingPlan ? "Edit Plan" : "Create Plan"}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <input placeholder="Plan name" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} className="bg-secondary/50 border border-border/40 rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50" />
              <input placeholder="Slug" value={planForm.slug} onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })} className="bg-secondary/50 border border-border/40 rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50" />
              <input placeholder="Price (GH\u20B5)" type="number" value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} className="bg-secondary/50 border border-border/40 rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50" />
              <input placeholder="Description" value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} className="bg-secondary/50 border border-border/40 rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <input placeholder="Min items" type="number" value={planForm.item_count_min} onChange={(e) => setPlanForm({ ...planForm, item_count_min: e.target.value })} className="bg-secondary/50 border border-border/40 rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50" />
              <input placeholder="Max items" type="number" value={planForm.item_count_max} onChange={(e) => setPlanForm({ ...planForm, item_count_max: e.target.value })} className="bg-secondary/50 border border-border/40 rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50" />
              <select value={planForm.interval} onChange={(e) => setPlanForm({ ...planForm, interval: e.target.value })} className="bg-secondary/50 border border-border/40 rounded-lg px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:border-accent/50">
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
              <input placeholder="Features (one per line)" value={planForm.features} onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })} className="bg-secondary/50 border border-border/40 rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50" />
            </div>
            <div className="flex gap-2">
              <button onClick={savePlan} disabled={!planForm.name || !planForm.price} className="px-4 py-2 bg-accent text-accent-foreground rounded-md text-[11px] tracking-wider font-body font-medium hover:bg-accent/90 transition-colors disabled:opacity-40">
                {editingPlan ? "Update Plan" : "Create Plan"}
              </button>
              {editingPlan && <button onClick={() => { setEditingPlan(null); setPlanForm({ name: "", slug: "", price: "", description: "", features: "", item_count_min: "2", item_count_max: "5", interval: "monthly" }); }} className="px-4 py-2 bg-secondary text-muted-foreground rounded-md text-[11px] tracking-wider font-body hover:text-foreground transition-colors">Cancel</button>}
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className={`bg-card border rounded-lg p-5 ${plan.is_active ? "border-border" : "border-border opacity-50"}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-xl font-light text-foreground">{plan.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-body tracking-wider ${plan.is_active ? "bg-green-500/15 text-green-400" : "bg-secondary text-muted-foreground"}`}>
                    {plan.is_active ? "Active" : "Off"}
                  </span>
                </div>
                <p className="font-display text-3xl font-light text-foreground mb-1">{formatCedi(plan.price)}<span className="text-sm text-muted-foreground">/mo</span></p>
                <p className="text-xs font-body text-muted-foreground mb-3">{plan.item_count_min}–{plan.item_count_max} items</p>
                <ul className="space-y-1 mb-4">
                  {(plan.features || []).slice(0, 3).map((f: string, i: number) => (
                    <li key={i} className="font-body text-xs text-muted-foreground flex items-start gap-2"><span className="text-accent">·</span> {f}</li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <button onClick={() => startEditPlan(plan)} className="flex-1 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md font-body text-xs tracking-wider transition-colors flex items-center justify-center gap-1"><Edit3 size={12} /> Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Style Quizzes */}
      {activeView === "quizzes" && (
        <div className="space-y-2">
          {quizzes.length === 0 ? (
            <div className="text-center py-16"><Brain size={40} className="mx-auto mb-4 text-muted-foreground/20" /><p className="font-body text-sm text-muted-foreground">No quizzes completed yet.</p></div>
          ) : quizzes.map((q) => (
            <div key={q.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body text-sm text-foreground">{q.display_name || q.email || q.user_id.slice(0, 8)}</span>
                <span className="text-xs font-body text-muted-foreground">{formatDate(q.completed_at || q.created_at)}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(q.sizes || {}).filter(([, v]) => v).map(([k, v]) => (
                  <span key={k} className="px-2 py-0.5 bg-secondary/50 rounded text-[10px] font-body uppercase text-foreground/70">{k}: {String(v)}</span>
                ))}
                {(q.preferred_colors || []).map((c: string) => (
                  <span key={c} className="px-2 py-0.5 bg-secondary/50 rounded text-[10px] font-body text-foreground/70">{c}</span>
                ))}
                {(q.preferred_styles || []).map((s: string) => (
                  <span key={s} className="px-2 py-0.5 bg-secondary/50 rounded text-[10px] font-body text-foreground/70">{s}</span>
                ))}
              </div>
              {q.notes && <p className="mt-2 text-xs font-body text-muted-foreground italic">"{q.notes}"</p>}
            </div>
          ))}
        </div>
      )}

      {/* Subscription Detail Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedSub(null)}>
          <div className="bg-popover border border-border rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-light text-foreground">Subscription Details</h3>
              <button onClick={() => setSelectedSub(null)} className="p-1 hover:bg-secondary rounded-md"><X size={16} /></button>
            </div>
            <div className="space-y-3 font-body text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subscriber</span><span className="text-foreground">{selectedSub.display_name || selectedSub.email || selectedSub.user_id}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="text-foreground">{selectedSub.plan_name} ({formatCedi(selectedSub.plan_price)}/mo)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${statusColors[selectedSub.status]}`}>{selectedSub.status}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span className="text-foreground">{formatDate(selectedSub.created_at)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Period End</span><span className="text-foreground">{formatDate(selectedSub.current_period_end)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Next Billing</span><span className="text-foreground">{formatDate(selectedSub.next_billing_date)}</span></div>
              {selectedSub.shipping_address && Object.keys(selectedSub.shipping_address).length > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-muted-foreground mb-2">Shipping Address</p>
                  <pre className="text-xs text-foreground/70 whitespace-pre-wrap">{JSON.stringify(selectedSub.shipping_address, null, 2)}</pre>
                </div>
              )}
              {selectedSub.style_preferences && Object.keys(selectedSub.style_preferences).length > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-muted-foreground mb-2">Style Preferences</p>
                  <pre className="text-xs text-foreground/70 whitespace-pre-wrap">{JSON.stringify(selectedSub.style_preferences, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedOrder(null)}>
          <div className="bg-popover border border-border rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-light text-foreground">Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-secondary rounded-md"><X size={16} /></button>
            </div>
            <div className="space-y-3 font-body text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subscriber</span><span className="text-foreground">{selectedOrder.display_name || selectedOrder.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="text-foreground">{selectedOrder.plan_name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="text-foreground">{formatCedi(selectedOrder.amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${statusColors[selectedOrder.status]}`}>{selectedOrder.status}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="text-foreground">{formatDate(selectedOrder.created_at)}</span></div>
              {selectedOrder.tracking_number && <div className="flex justify-between"><span className="text-muted-foreground">Tracking</span><span className="text-foreground">{selectedOrder.tracking_number}</span></div>}
              {selectedOrder.shipped_at && <div className="flex justify-between"><span className="text-muted-foreground">Shipped</span><span className="text-foreground">{formatDate(selectedOrder.shipped_at)}</span></div>}
              {selectedOrder.delivered_at && <div className="flex justify-between"><span className="text-muted-foreground">Delivered</span><span className="text-foreground">{formatDate(selectedOrder.delivered_at)}</span></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptions;
