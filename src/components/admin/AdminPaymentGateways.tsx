import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, CreditCard, Shield } from "lucide-react";
import { toast } from "sonner";

interface GatewayConfig {
  active_gateway: string | null;
  gateways: {
    stripe: { enabled: boolean; publishable_key: string; mode: "test" | "live" };
    paypal: { enabled: boolean; client_id: string; mode: "sandbox" | "live" };
    paystack: { enabled: boolean; public_key: string; mode: "test" | "live" };
  flutterwave: { enabled: boolean; public_key: string; mode: "test" | "live" };
    shopify: { enabled: boolean; public_key: string; mode: "test" | "live" };
  };
}

const defaultConfig: GatewayConfig = {
  active_gateway: null,
  gateways: {
    stripe: { enabled: false, publishable_key: "", mode: "test" },
    paypal: { enabled: false, client_id: "", mode: "sandbox" },
    paystack: { enabled: false, public_key: "", mode: "test" },
    flutterwave: { enabled: false, public_key: "", mode: "test" },
    shopify: { enabled: false, public_key: "", mode: "test" },
  },
};

const gatewayInfo = [
  {
    id: "stripe" as const,
    name: "Stripe",
    description: "Accept credit cards, Apple Pay, Google Pay worldwide",
    keyLabel: "Publishable Key",
    keyPlaceholder: "pk_test_...",
    modes: ["test", "live"] as const,
  },
  {
    id: "paypal" as const,
    name: "PayPal",
    description: "Accept PayPal, Venmo, and credit card payments",
    keyLabel: "Client ID",
    keyPlaceholder: "AZ...",
    modes: ["sandbox", "live"] as const,
  },
  {
    id: "paystack" as const,
    name: "Paystack",
    description: "Popular payment gateway for Africa — cards, mobile money, bank transfers",
    keyLabel: "Public Key",
    keyPlaceholder: "pk_test_...",
    modes: ["test", "live"] as const,
  },
  {
    id: "flutterwave" as const,
    name: "Flutterwave",
    description: "Accept payments across Africa and globally — cards, mobile money, bank",
    keyLabel: "Public Key",
    keyPlaceholder: "FLWPUBK_TEST-...",
    modes: ["test", "live"] as const,
  },
  {
    id: "shopify" as const,
    name: "Shopify Payments",
    description: "Use Shopify's built-in checkout and payment processing",
    keyLabel: "Storefront Access Token",
    keyPlaceholder: "shpat_...",
    modes: ["test", "live"] as const,
  },
];

const AdminPaymentGateways = () => {
  const [config, setConfig] = useState<GatewayConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("key", "payment_gateways")
      .single();
    if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
      const val = data.value as Record<string, unknown>;
      setConfig({
        active_gateway: (val.active_gateway as string) || null,
        gateways: {
          ...defaultConfig.gateways,
          ...(val.gateways as Record<string, unknown> || {}),
        } as GatewayConfig["gateways"],
      });
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "payment_gateways")
        .single();

      const payload = JSON.parse(JSON.stringify(config));
      if (existing) {
        await supabase.from("site_settings").update({ value: payload }).eq("key", "payment_gateways");
      } else {
        await supabase.from("site_settings").insert([{ key: "payment_gateways", value: payload }]);
      }
      toast.success("Payment settings saved");
    } catch {
      toast.error("Failed to save payment settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleGateway = (id: keyof GatewayConfig["gateways"], enabled: boolean) => {
    setConfig((prev) => ({
      ...prev,
      active_gateway: enabled ? id : prev.active_gateway === id ? null : prev.active_gateway,
      gateways: {
        ...prev.gateways,
        [id]: { ...prev.gateways[id], enabled },
      },
    }));
  };

  const setActiveGateway = (id: string) => {
    setConfig((prev) => ({ ...prev, active_gateway: id }));
  };

  const updateKey = (id: keyof GatewayConfig["gateways"], value: string) => {
    setConfig((prev) => ({
      ...prev,
      gateways: {
        ...prev.gateways,
        [id]: {
          ...prev.gateways[id],
          ...(id === "stripe"
            ? { publishable_key: value }
            : id === "paypal"
            ? { client_id: value }
            : { public_key: value }),
        },
      },
    }));
  };

  const updateMode = (id: keyof GatewayConfig["gateways"], mode: string) => {
    setConfig((prev) => ({
      ...prev,
      gateways: {
        ...prev.gateways,
        [id]: { ...prev.gateways[id], mode },
      },
    }));
  };

  const getKeyValue = (id: keyof GatewayConfig["gateways"]): string => {
    const gw = config.gateways[id];
    if (id === "stripe") return (gw as typeof config.gateways.stripe).publishable_key;
    if (id === "paypal") return (gw as typeof config.gateways.paypal).client_id;
    return (gw as typeof config.gateways.paystack).public_key;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-light">Payment Gateways</h2>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Choose and configure your preferred payment provider
          </p>
        </div>
        <Button
          onClick={save}
          disabled={saving}
          className="bg-accent text-accent-foreground hover:bg-accent/90 font-body text-xs tracking-wider"
        >
          <Save size={14} className="mr-1" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* Active gateway indicator */}
      {config.active_gateway && (
        <div className="mb-6 p-3 rounded-lg bg-green-900/20 border border-green-800/30 flex items-center gap-3">
          <Shield size={16} className="text-green-400" />
          <p className="font-body text-sm text-green-400">
            Active gateway: <span className="font-semibold capitalize">{config.active_gateway}</span>
          </p>
        </div>
      )}

      <div className="space-y-4">
        {gatewayInfo.map((gw) => {
          const gwConfig = config.gateways[gw.id];
          const isActive = config.active_gateway === gw.id;
          return (
            <div
              key={gw.id}
              className={`border rounded-lg p-5 transition-colors ${
                isActive
                  ? "border-accent/40 bg-accent/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CreditCard size={20} className={isActive ? "text-accent" : "text-muted-foreground"} />
                  <div>
                    <h3 className="font-body text-sm font-medium text-foreground">{gw.name}</h3>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">{gw.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {gwConfig.enabled && (
                    <button
                      onClick={() => setActiveGateway(gw.id)}
                      className={`font-body text-xs px-3 py-1 rounded transition-colors ${
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isActive ? "Active" : "Set Active"}
                    </button>
                  )}
                  <Switch
                    checked={gwConfig.enabled}
                    onCheckedChange={(checked) => toggleGateway(gw.id, checked)}
                  />
                </div>
              </div>

              {gwConfig.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border">
                  <div>
                    <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">
                      {gw.keyLabel}
                    </Label>
                    <Input
                      value={getKeyValue(gw.id)}
                      onChange={(e) => updateKey(gw.id, e.target.value)}
                      placeholder={gw.keyPlaceholder}
                      className="mt-1 bg-secondary border-border font-body text-sm font-mono"
                    />
                  </div>
                  <div>
                    <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">
                      Mode
                    </Label>
                    <select
                      value={gwConfig.mode}
                      onChange={(e) => updateMode(gw.id, e.target.value)}
                      className="mt-1 w-full bg-secondary border border-border rounded-md px-3 py-2 font-body text-sm text-foreground outline-none"
                    >
                      {gw.modes.map((m) => (
                        <option key={m} value={m}>
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-card border border-border">
        <p className="font-body text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Note:</strong> Only public/publishable keys are stored here. 
          Secret keys should be configured securely in the backend. Only one gateway can be active at a time — 
          this is the one used during checkout.
        </p>
      </div>
    </div>
  );
};

export default AdminPaymentGateways;
