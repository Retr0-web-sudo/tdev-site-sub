import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Package, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;

const statusOptions = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

const statusColor: Record<string, string> = {
  pending: "bg-yellow-900/30 text-yellow-400 border-yellow-800/40",
  paid: "bg-green-900/30 text-green-400 border-green-800/40",
  processing: "bg-blue-900/30 text-blue-400 border-blue-800/40",
  shipped: "bg-purple-900/30 text-purple-400 border-purple-800/40",
  delivered: "bg-emerald-900/30 text-emerald-400 border-emerald-800/40",
  cancelled: "bg-red-900/30 text-red-400 border-red-800/40",
  refunded: "bg-orange-900/30 text-orange-400 border-orange-800/40",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load orders");
    else setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    if (error) toast.error("Failed to update status");
    else {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      toast.success(`Order status updated to ${newStatus}`);
    }
    setUpdatingId(null);
  };

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const addr = o.shipping_address as Record<string, string> | null;
      return (
        o.id.toLowerCase().includes(s) ||
        addr?.email?.toLowerCase().includes(s) ||
        addr?.name?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-light">Orders</h2>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {orders.length} total orders
          </p>
        </div>
        <Button onClick={fetchOrders} variant="outline" size="sm" className="gap-2 font-body text-xs">
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, name, or email..."
            className="pl-9 bg-secondary border-border font-body text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-secondary border border-border rounded-md px-3 py-2 font-body text-sm text-foreground outline-none"
        >
          <option value="all">All Statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="font-body text-sm text-muted-foreground text-center py-12">Loading orders...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Package size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-body text-sm text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const addr = order.shipping_address as Record<string, string> | null;
            const items = Array.isArray(order.items) ? order.items : [];
            const isExpanded = expandedId === order.id;

            return (
              <div key={order.id} className="border border-border rounded-lg bg-secondary/30 overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="min-w-0">
                      <p className="font-body text-sm text-foreground font-medium truncate">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-body font-medium border ${statusColor[order.status] || "bg-secondary text-muted-foreground border-border"}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-display text-lg text-foreground">${Number(order.total).toFixed(2)}</span>
                    {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Customer info */}
                      <div>
                        <h4 className="font-body text-xs tracking-wider uppercase text-muted-foreground mb-2">Customer</h4>
                        {addr ? (
                          <div className="font-body text-sm text-foreground space-y-0.5">
                            <p>{addr.name}</p>
                            <p className="text-muted-foreground">{addr.email}</p>
                            {addr.phone && <p className="text-muted-foreground">{addr.phone}</p>}
                          </div>
                        ) : (
                          <p className="font-body text-sm text-muted-foreground">No customer info</p>
                        )}
                      </div>

                      {/* Shipping address */}
                      <div>
                        <h4 className="font-body text-xs tracking-wider uppercase text-muted-foreground mb-2">Shipping Address</h4>
                        {addr ? (
                          <div className="font-body text-sm text-foreground space-y-0.5">
                            <p>{addr.address}</p>
                            <p>{[addr.city, addr.state, addr.zip].filter(Boolean).join(", ")}</p>
                            <p>{addr.country}</p>
                          </div>
                        ) : (
                          <p className="font-body text-sm text-muted-foreground">No address</p>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <h4 className="font-body text-xs tracking-wider uppercase text-muted-foreground mb-2">Items</h4>
                      <div className="space-y-2">
                        {items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center font-body text-sm">
                            <div>
                              <span className="text-foreground">{item.name}</span>
                              {(item.size || item.color) && (
                                <span className="text-muted-foreground ml-2 text-xs">
                                  ({[item.color, item.size].filter(Boolean).join(" / ")})
                                </span>
                              )}
                              <span className="text-muted-foreground ml-2">×{item.quantity}</span>
                            </div>
                            <span className="text-foreground">GH¢{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status update */}
                    <div className="flex items-center gap-3 pt-2 border-t border-border">
                      <span className="font-body text-xs text-muted-foreground">Update status:</span>
                      <div className="flex flex-wrap gap-2">
                        {statusOptions.map((s) => (
                          <button
                            key={s}
                            disabled={updatingId === order.id || order.status === s}
                            onClick={() => updateStatus(order.id, s)}
                            className={`px-3 py-1 rounded font-body text-xs transition-colors ${
                              order.status === s
                                ? "bg-accent text-accent-foreground"
                                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                            } disabled:opacity-50`}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
