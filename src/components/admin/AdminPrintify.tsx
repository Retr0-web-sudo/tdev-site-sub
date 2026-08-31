import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RefreshCw, ArrowDownUp, Package, ShoppingCart, BarChart3 } from "lucide-react";

const AdminPrintify = () => {
  const [syncing, setSyncing] = useState<string | null>(null);

  const triggerSync = async (type: "products" | "orders" | "inventory") => {
    setSyncing(type);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/printify-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ action: `sync_${type}` }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Sync failed");
      toast.success(`${type} sync completed`, { description: data.message });
    } catch (err: any) {
      toast.error(`${type} sync failed`, { description: err.message });
    } finally {
      setSyncing(null);
    }
  };

  const syncActions = [
    { type: "products" as const, icon: Package, label: "Sync Products", desc: "Pull product catalog from Printify and push local products" },
    { type: "orders" as const, icon: ShoppingCart, label: "Sync Orders", desc: "Push new orders to Printify for fulfillment" },
    { type: "inventory" as const, icon: BarChart3, label: "Sync Inventory", desc: "Update stock levels from Printify" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-light">Printify Integration</h2>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Two-way sync between your store and Printify for print-on-demand fulfillment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {syncActions.map((action) => {
          const Icon = action.icon;
          return (
            <div key={action.type} className="p-6 rounded-xl border border-border bg-card space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Icon size={20} className="text-accent" />
                </div>
                <h3 className="font-display text-base">{action.label}</h3>
              </div>
              <p className="font-body text-xs text-muted-foreground">{action.desc}</p>
              <Button
                onClick={() => triggerSync(action.type)}
                disabled={syncing !== null}
                className="w-full gap-2"
                variant="outline"
              >
                {syncing === action.type ? (
                  <><RefreshCw size={14} className="animate-spin" /> Syncing…</>
                ) : (
                  <><ArrowDownUp size={14} /> Run Sync</>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="p-5 rounded-xl border border-border bg-card space-y-3">
        <h3 className="font-display text-lg">Setup</h3>
        <p className="font-body text-xs text-muted-foreground">
          The Printify API key has been configured as a backend secret. The sync functions will
          automatically use it. If you need to update the key, contact your administrator.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Shop ID (if needed)</Label>
            <Input placeholder="Your Printify shop ID" />
          </div>
          <div>
            <Label className="text-xs">Webhook URL</Label>
            <Input
              readOnly
              value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/printify-webhook`}
              onClick={(e) => {
                (e.target as HTMLInputElement).select();
                navigator.clipboard.writeText((e.target as HTMLInputElement).value);
                toast.success("Copied webhook URL");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPrintify;
