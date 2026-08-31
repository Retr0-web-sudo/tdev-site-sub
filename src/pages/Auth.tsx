import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Seo from "@/components/Seo";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate("/admin");
    return null;
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset link sent! Check your email.");
      setIsForgot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else if (!isLogin) {
      toast.success("Account created! Check your email to confirm.");
    } else {
      navigate("/admin");
    }
  };

  if (isForgot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center section-padding">
        <Seo title="Reset Password — TDEV" description="Reset your TDEV account password." path="/auth" noindex />
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <a href="/" className="font-display text-4xl font-light tracking-[0.15em] text-foreground">
              TDEV
            </a>
            <h1 className="font-display text-2xl font-light text-foreground mt-4">Reset your password</h1>
            <p className="font-body text-sm text-muted-foreground mt-2 tracking-wider">
              Enter your email to reset your password
            </p>
          </div>
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div>
              <Label htmlFor="email" className="font-body text-xs tracking-wider uppercase text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-card border-border font-body"
                placeholder="you@example.com"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-primary-foreground hover:bg-foreground/90 font-body text-xs tracking-[0.2em] uppercase py-6"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
          <p className="text-center mt-6 font-body text-sm text-muted-foreground">
            <button onClick={() => setIsForgot(false)} className="text-accent hover:underline">
              Back to Sign In
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center section-padding">
      <Seo
        title={isLogin ? "Sign In — TDEV" : "Create Account — TDEV"}
        description="Access your TDEV account to manage orders, wishlist, and profile."
        path="/auth"
        noindex
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <a href="/" className="font-display text-4xl font-light tracking-[0.15em] text-foreground">
            TDEV
          </a>
          <h1 className="font-display text-2xl font-light text-foreground mt-4">
            {isLogin ? "Sign in to TDEV" : "Create your TDEV account"}
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-2 tracking-wider">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="email" className="font-body text-xs tracking-wider uppercase text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 bg-card border-border font-body"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password" className="font-body text-xs tracking-wider uppercase text-muted-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 bg-card border-border font-body"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-primary-foreground hover:bg-foreground/90 font-body text-xs tracking-[0.2em] uppercase py-6"
          >
            {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        {isLogin && (
          <p className="text-center mt-4 font-body text-sm">
            <button onClick={() => setIsForgot(true)} className="text-accent hover:underline">
              Forgot your password?
            </button>
          </p>
        )}

        <p className="text-center mt-4 font-body text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-accent hover:underline"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
