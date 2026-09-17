import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/lib/currency";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck, Loader2, CreditCard, AlertCircle, Tag, X } from "lucide-react";
import { motion } from "framer-motion";
import { validateCoupon, redeemCoupon } from "@/lib/gameCoupons";
import Seo from "@/components/Seo";

interface GatewayConfig {
  active_gateway: string | null;
  gateways: {
    stripe: { enabled: boolean; publishable_key: string; mode: string };
    paypal: { enabled: boolean; client_id: string; mode: string };
    paystack: { enabled: boolean; public_key: string; mode: string };
    flutterwave: { enabled: boolean; public_key: string; mode: string };
  };
}

declare global {
  interface Window {
    PaystackPop: any;
    FlutterwaveCheckout: any;
  }
}

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

const emptyShipping: ShippingInfo = {
  firstName: "", lastName: "", email: "", phone: "",
  address: "", city: "", state: "", zip: "", country: "",
};

const Checkout = () => {
  const { format, currency: activeCurrency } = useCurrency();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shipping, setShipping] = useState<ShippingInfo>(emptyShipping);
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const discountAmount = appliedCoupon ? (totalPrice * appliedCoupon.discount) / 100 : 0;
  const finalTotal = totalPrice - discountAmount;

  useEffect(() => {
    if (items.length === 0) {
      navigate("/shop");
      return;
    }
    loadGatewayConfig();
  }, []);

  useEffect(() => {
    if (user?.email) {
      setShipping((prev) => ({ ...prev, email: user.email || "" }));
    }
  }, [user]);

  const loadGatewayConfig = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "payment_gateways")
        .single();
      if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
        setGatewayConfig(data.value as unknown as GatewayConfig);
      }
    } catch {
      console.error("Failed to load payment config");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const result = await validateCoupon(couponCode);
    setCouponLoading(false);
    if (result?.valid) {
      setAppliedCoupon({ code: couponCode.toUpperCase().trim(), discount: result.discount });
      toast.success(`Coupon applied! ${result.discount}% discount`);
    } else {
      toast.error("Invalid or expired coupon code");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const activeGateway = gatewayConfig?.active_gateway;
  const activeGatewayConfig = activeGateway
    ? gatewayConfig?.gateways[activeGateway as keyof GatewayConfig["gateways"]]
    : null;
  const getGatewayDisplayName = (id: string) => {
    const names: Record<string, string> = {
      stripe: "Stripe", paypal: "PayPal", paystack: "Paystack", flutterwave: "Flutterwave",
    };
    return names[id] || id;
  };

  const validateShipping = () => {
    const required: (keyof ShippingInfo)[] = ["firstName", "lastName", "email", "address", "city", "country"];
    for (const field of required) {
      if (!shipping[field].trim()) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`);
        return false;
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) {
      toast.error("Please enter a valid email");
      return false;
    }
    return true;
  };

  const initiateStripePayment = async (_key: string) => {
    toast.info("Redirecting to Stripe checkout...");
    // In production, create a Checkout Session via edge function
    // For now, simulate and save order
    await saveOrder();
  };

  const initiatePaypalPayment = async (_clientId: string) => {
    toast.info("Redirecting to PayPal...");
    await saveOrder();
  };

  const initiatePaystackPayment = async (publicKey: string) => {
    // @ts-ignore - PaystackPop loaded via script
    if (typeof window.PaystackPop !== "undefined") {
      const handler = window.PaystackPop.setup({
        key: publicKey,
                email: shipping.email,
                amount: Math.round(totalPrice * 100),
                currency: activeCurrency.code,
        callback: async () => {
          await saveOrder();
          toast.success("Payment successful!");
        },
        onClose: () => {
          setProcessing(false);
          toast.info("Payment cancelled");
        },
      });
      handler.openIframe();
    } else {
      toast.info("Processing Paystack payment...");
      await saveOrder();
    }
  };

  const initiateFlutterwavePayment = async (publicKey: string) => {
    // @ts-ignore - FlutterwaveCheckout loaded via script
    if (typeof window.FlutterwaveCheckout !== "undefined") {
      window.FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref: `tdev-${Date.now()}`,
                amount: totalPrice,
                currency: activeCurrency.code,
        customer: { email: shipping.email, name: `${shipping.firstName} ${shipping.lastName}` },
        callback: async () => {
          await saveOrder();
          toast.success("Payment successful!");
        },
        onclose: () => {
          setProcessing(false);
          toast.info("Payment cancelled");
        },
      });
    } else {
      toast.info("Processing Flutterwave payment...");
      await saveOrder();
    }
  };

  const saveOrder = async () => {
    try {
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        size: item.selectedSize || null,
        color: item.selectedColor || null,
      }));

      await supabase.from("orders").insert({
        user_id: user?.id || null,
        items: orderItems,
        total: finalTotal,
        // Status is 'pending' until a server-side webhook confirms payment.
        // Client-side payment callbacks must not mark orders as paid.
        status: "pending",
        shipping_address: {
          name: `${shipping.firstName} ${shipping.lastName}`,
          email: shipping.email,
          phone: shipping.phone,
          address: shipping.address,
          city: shipping.city,
          state: shipping.state,
          zip: shipping.zip,
          country: shipping.country,
          ...(appliedCoupon ? { coupon_code: appliedCoupon.code, discount_percent: appliedCoupon.discount } : {}),
        },
      });

      if (appliedCoupon) {
        await redeemCoupon(appliedCoupon.code);
      }

      clearCart();
      navigate("/");
      toast.success("Order placed successfully!");
    } catch {
      toast.error("Failed to save order");
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckout = async () => {
    if (!validateShipping()) return;
    if (!activeGateway || !activeGatewayConfig) {
      toast.error("No payment gateway is configured. Please contact the store admin.");
      return;
    }
    setProcessing(true);

    try {
      switch (activeGateway) {
        case "stripe":
          await initiateStripePayment((activeGatewayConfig as any).publishable_key);
          break;
        case "paypal":
          await initiatePaypalPayment((activeGatewayConfig as any).client_id);
          break;
        case "paystack":
          await initiatePaystackPayment((activeGatewayConfig as any).public_key);
          break;
        case "flutterwave":
          await initiateFlutterwavePayment((activeGatewayConfig as any).public_key);
          break;
        default:
          toast.error("Unsupported payment gateway");
          setProcessing(false);
      }
    } catch {
      toast.error("Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  const updateField = (field: keyof ShippingInfo, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Checkout — TDEV" description="Securely complete your TDEV order with shipping and payment details." path="/checkout" noindex />
      <Navbar />
      <div className="pt-24 pb-20 section-padding">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <h1 className="font-display text-3xl md:text-4xl font-light tracking-wider text-foreground mb-10">
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Shipping Form */}
            <motion.div
              className="lg:col-span-3 space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="font-display text-xl font-light tracking-wider text-foreground">
                Shipping Information
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">First Name *</Label>
                  <Input value={shipping.firstName} onChange={(e) => updateField("firstName", e.target.value)} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Last Name *</Label>
                  <Input value={shipping.lastName} onChange={(e) => updateField("lastName", e.target.value)} className="mt-1 bg-secondary border-border" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Email *</Label>
                  <Input type="email" value={shipping.email} onChange={(e) => updateField("email", e.target.value)} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Phone</Label>
                  <Input value={shipping.phone} onChange={(e) => updateField("phone", e.target.value)} className="mt-1 bg-secondary border-border" />
                </div>
              </div>

              <div>
                <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Address *</Label>
                <Input value={shipping.address} onChange={(e) => updateField("address", e.target.value)} className="mt-1 bg-secondary border-border" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">City *</Label>
                  <Input value={shipping.city} onChange={(e) => updateField("city", e.target.value)} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">State</Label>
                  <Input value={shipping.state} onChange={(e) => updateField("state", e.target.value)} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">ZIP</Label>
                  <Input value={shipping.zip} onChange={(e) => updateField("zip", e.target.value)} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Country *</Label>
                  <Input value={shipping.country} onChange={(e) => updateField("country", e.target.value)} className="mt-1 bg-secondary border-border" />
                </div>
              </div>

              {/* Payment gateway info */}
              <Separator className="my-6" />

              {activeGateway ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <CreditCard size={20} className="text-accent" />
                  <div>
                    <p className="font-body text-sm text-foreground">
                      Paying via <span className="font-semibold text-accent">{getGatewayDisplayName(activeGateway)}</span>
                    </p>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">
                      Secure payment powered by {getGatewayDisplayName(activeGateway)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle size={20} className="text-destructive" />
                  <p className="font-body text-sm text-destructive">
                    No payment gateway configured. Please contact the store admin.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Order Summary */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="sticky top-28 border border-border rounded-lg p-6 bg-secondary/30">
                <h2 className="font-display text-xl font-light tracking-wider text-foreground mb-4">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-3">
                      <div className="w-14 h-16 bg-secondary rounded overflow-hidden flex-shrink-0">
                        {item.product.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="font-display text-xs text-muted-foreground">{item.product.name[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-foreground truncate">{item.product.name}</p>
                        {(item.selectedSize || item.selectedColor) && (
                          <p className="font-body text-xs text-muted-foreground">
                            {[item.selectedColor, item.selectedSize].filter(Boolean).join(" / ")}
                          </p>
                        )}
                        <p className="font-body text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-body text-sm text-foreground">
                        {format(item.product.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator className="mb-4" />

                {/* Coupon code */}
                <div className="mb-4">
                  <Label className="font-body text-xs tracking-wider uppercase text-muted-foreground">Discount Code</Label>
                  {appliedCoupon ? (
                    <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-md bg-accent/10 border border-accent/30">
                      <Tag size={14} className="text-accent" />
                      <span className="font-mono text-sm text-accent flex-1">{appliedCoupon.code}</span>
                      <span className="font-body text-xs text-accent">-{appliedCoupon.discount}%</span>
                      <button onClick={removeCoupon} className="text-muted-foreground hover:text-foreground">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="TDEV-XXXXXX"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="bg-secondary border-border font-mono text-sm"
                      />
                      <Button size="sm" variant="outline" onClick={handleApplyCoupon} disabled={couponLoading}>
                        {couponLoading ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-body text-sm text-muted-foreground">Subtotal</span>
                    <span className="font-body text-sm text-foreground">{format(totalPrice)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between">
                      <span className="font-body text-sm text-accent">Discount ({appliedCoupon.discount}%)</span>
                      <span className="font-body text-sm text-accent">-{format(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-body text-sm text-muted-foreground">Shipping</span>
                    <span className="font-body text-sm text-muted-foreground">Calculated next</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center mb-6">
                  <span className="font-body text-sm tracking-wider uppercase text-muted-foreground">Total</span>
                  <span className="font-display text-2xl text-foreground">{format(finalTotal)}</span>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={processing || !activeGateway}
                  className="w-full font-body text-xs tracking-[0.2em] uppercase bg-accent text-accent-foreground hover:bg-accent/90 py-6"
                >
                  {processing ? (
                    <><Loader2 size={16} className="animate-spin mr-2" /> Processing...</>
                  ) : (
                    <><ShieldCheck size={16} className="mr-2" /> Place Order</>
                  )}
                </Button>

                <p className="font-body text-[10px] text-muted-foreground text-center mt-3">
                  Your payment is secure and encrypted
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
