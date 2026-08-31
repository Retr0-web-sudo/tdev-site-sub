import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Shirt, Search, Eye, Trash2, DollarSign, Clock } from "lucide-react";
import { toast } from "sonner";

interface DesignRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  shirt_color: string;
  shirt_size: string;
  design_image_url: string | null;
  notes: string | null;
  quantity: number;
  status: string;
  admin_notes: string | null;
  quoted_price: number | null;
  created_at: string;
}

const STATUS_OPTIONS = ["pending", "quoted", "approved", "in_production", "completed", "cancelled"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  quoted: "bg-blue-500/20 text-blue-400",
  approved: "bg-green-500/20 text-green-400",
  in_production: "bg-purple-500/20 text-purple-400",
  completed: "bg-emerald-500/20 text-emerald-400",
  cancelled: "bg-red-500/20 text-red-400",
};

const AdminDesignRequests = () => {
  const [requests, setRequests] = useState<DesignRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStatus, setEditStatus] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("custom_design_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRequests((data as DesignRequest[]) || []);
    setLoading(false);
  };

  const updateRequest = async (id: string) => {
    const updates: { status?: string; admin_notes?: string | null; quoted_price?: number | null } = {};
    if (editStatus) updates.status = editStatus;
    if (editNotes !== undefined) updates.admin_notes = editNotes.trim() || null;
    if (editPrice) updates.quoted_price = parseFloat(editPrice) || null;

    const { error } = await supabase.from("custom_design_requests").update(updates).eq("id", id);
    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success("Updated successfully");
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } as DesignRequest : r))
      );
    }
  };

  const deleteRequest = async (id: string) => {
    await supabase.from("custom_design_requests").delete().eq("id", id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
    toast.success("Request deleted");
  };

  const filtered = requests.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return r.name.toLowerCase().includes(s) || r.email.toLowerCase().includes(s);
    }
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-light">Custom Designs</h2>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {pendingCount} pending · {requests.length} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests..."
            className="w-full pl-9 pr-3 py-2 bg-[hsl(25,15%,12%)] border border-[hsl(25,12%,20%)] rounded-md font-body text-sm text-foreground outline-none"
          />
        </div>
        {["all", ...STATUS_OPTIONS].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-body text-xs px-3 py-1.5 rounded transition-colors capitalize ${
              filter === f ? "bg-accent text-accent-foreground" : "bg-[hsl(25,12%,14%)] text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="font-body text-sm text-muted-foreground text-center py-12">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-12">No design requests found</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const isExpanded = expandedId === req.id;
            return (
              <div
                key={req.id}
                className="border border-[hsl(25,12%,20%)] bg-[hsl(25,15%,10%)] rounded-lg"
              >
                <button
                  onClick={() => {
                    setExpandedId(isExpanded ? null : req.id);
                    if (!isExpanded) {
                      setEditNotes(req.admin_notes || "");
                      setEditPrice(req.quoted_price?.toString() || "");
                      setEditStatus(req.status);
                    }
                  }}
                  className="w-full text-left p-4 flex items-start gap-3"
                >
                  <Shirt size={16} className="text-accent mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-body text-sm font-medium">{req.name}</span>
                      <span className="font-body text-xs text-muted-foreground">{req.email}</span>
                      <span className={`font-body text-xs px-2 py-0.5 rounded capitalize ${STATUS_COLORS[req.status] || ""}`}>
                        {req.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">
                      Size {req.shirt_size} · Qty {req.quantity}
                      {req.quoted_price ? ` · $${req.quoted_price}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Clock size={12} className="text-muted-foreground" />
                    <span className="font-body text-xs text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[hsl(25,12%,18%)] pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Design preview */}
                      <div>
                        <p className="font-body text-xs text-muted-foreground mb-2">Design Preview</p>
                        {req.design_image_url ? (
                          <div className="relative rounded-lg overflow-hidden border border-border">
                            <div className="bg-muted p-4 flex justify-center">
                              <div className="relative" style={{ width: 200 }}>
                                <svg viewBox="0 0 400 500" className="w-full">
                                  <path
                                    d="M80 0 L0 80 L60 120 L60 500 L340 500 L340 120 L400 80 L320 0 L260 40 Q200 70 140 40 Z"
                                    fill={req.shirt_color}
                                    stroke="hsl(25, 12%, 30%)"
                                    strokeWidth="2"
                                  />
                                </svg>
                                <img
                                  src={req.design_image_url}
                                  alt="Custom design"
                                  className="absolute"
                                  style={{ top: "18%", left: "18%", width: "64%", height: "72%", objectFit: "contain" }}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-40 bg-muted rounded-lg border border-border">
                            <p className="font-body text-xs text-muted-foreground">No design image</p>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="font-body text-xs text-muted-foreground">Shirt Color</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: req.shirt_color }} />
                              <span className="font-body text-sm">{req.shirt_color}</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-body text-xs text-muted-foreground">Size</p>
                            <p className="font-body text-sm mt-1">{req.shirt_size}</p>
                          </div>
                          <div>
                            <p className="font-body text-xs text-muted-foreground">Quantity</p>
                            <p className="font-body text-sm mt-1">{req.quantity}</p>
                          </div>
                          <div>
                            <p className="font-body text-xs text-muted-foreground">Phone</p>
                            <p className="font-body text-sm mt-1">{req.phone || "—"}</p>
                          </div>
                        </div>

                        {req.notes && (
                          <div>
                            <p className="font-body text-xs text-muted-foreground">Customer Notes</p>
                            <p className="font-body text-sm mt-1 bg-[hsl(25,15%,8%)] rounded p-2 whitespace-pre-wrap">
                              {req.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admin controls */}
                    <div className="border-t border-[hsl(25,12%,18%)] pt-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <p className="font-body text-xs text-muted-foreground mb-1">Status</p>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="w-full px-3 py-2 bg-[hsl(25,15%,12%)] border border-[hsl(25,12%,20%)] rounded font-body text-sm text-foreground capitalize"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s.replace("_", " ")}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <p className="font-body text-xs text-muted-foreground mb-1">Quoted Price</p>
                          <div className="relative">
                            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="number" min={0} step={0.01}
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="pl-8 bg-[hsl(25,15%,12%)] border-[hsl(25,12%,20%)] font-body text-sm"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="font-body text-xs text-muted-foreground mb-1">Admin Notes</p>
                        <Textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Internal notes..."
                          rows={2}
                          className="bg-[hsl(25,15%,12%)] border-[hsl(25,12%,20%)] font-body text-sm resize-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateRequest(req.id)}
                          className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-xs"
                        >
                          <Eye size={12} className="mr-1" /> Save Changes
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => deleteRequest(req.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 font-body text-xs"
                        >
                          <Trash2 size={12} className="mr-1" /> Delete
                        </Button>
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

export default AdminDesignRequests;
