import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { user, loading, subscription } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sign In state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign Up state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [position, setPosition] = useState("");

  useEffect(() => {
    const handleBanned = () => {
      toast.error("Your account has been suspended. Please contact support.", { duration: 8000 });
    };
    window.addEventListener("account-banned", handleBanned);
    return () => window.removeEventListener("account-banned", handleBanned);
  }, []);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const getPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: "Weak", color: "bg-primary", width: "25%" };
    if (score <= 2) return { level: "Fair", color: "bg-pif-gold", width: "50%" };
    if (score <= 3) return { level: "Good", color: "bg-secondary", width: "75%" };
    return { level: "Strong", color: "bg-pif-green", width: "100%" };
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setIsLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/dashboard");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail.trim() || !signupPassword.trim() || !firstName.trim()) return;
    setIsLoading(true);

    // Store signup details in sessionStorage for after payment
    sessionStorage.setItem("pif_signup", JSON.stringify({
      email: signupEmail.trim(),
      password: signupPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      position,
    }));

    try {
      // Create checkout session (unauthenticated)
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { email: signupEmail.trim() },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || "Could not start checkout");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error("Google sign-in failed");
  };

  const strength = getPasswordStrength(signupPassword);

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-background items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
          <span className="font-display text-[20rem] leading-none text-foreground select-none">PIF</span>
        </div>
        <div className="relative z-10 px-12 space-y-8 max-w-lg">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="font-heading text-xl text-primary-foreground">PIF</span>
          </div>
          <h1 className="font-display text-6xl text-foreground leading-none">
            Train Like<br />The Best.<br />
            <span className="text-primary">Become One.</span>
          </h1>
          <div className="flex items-center gap-2 mt-8">
            {["ZE", "AW", "TW", "HM"].map((initials, i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center -ml-2 first:ml-0">
                <span className="text-xs font-heading text-muted-foreground">{initials}</span>
              </div>
            ))}
            <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center -ml-2">
              <span className="text-xs font-heading text-primary">+50</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span><strong className="text-foreground">2,400+</strong> Athletes</span>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-card">
        <div className="w-full max-w-md space-y-8">
          {/* Tab Switcher */}
          <div className="flex gap-1 p-1 rounded-xl bg-muted">
            <button
              onClick={() => setTab("signin")}
              className={`flex-1 py-2.5 rounded-lg font-heading text-sm tracking-wider transition-all ${tab === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 py-2.5 rounded-lg font-heading text-sm tracking-wider transition-all ${tab === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Start Trial
            </button>
          </div>

          {tab === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <h2 className="text-3xl font-heading text-foreground">Welcome Back</h2>
                <p className="text-muted-foreground mt-1">Sign in to continue your training</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-heading text-xs tracking-wider text-muted-foreground">Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-muted border-border h-12" required />
                </div>
                <div className="space-y-2">
                  <Label className="font-heading text-xs tracking-wider text-muted-foreground">Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-muted border-border h-12 pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={async () => {
                      if (!email.trim()) {
                        toast.error("Enter your email first");
                        return;
                      }
                      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      if (error) toast.error(error.message);
                      else toast.success("Password reset link sent! Check your email.");
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-12 btn-cta bg-primary hover:bg-primary/90 glow-red-hover text-base">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="px-2 bg-card text-muted-foreground">or</span></div>
              </div>
              <Button type="button" variant="outline" onClick={handleGoogleSignIn} className="w-full h-12 font-heading text-sm tracking-wider">
                Continue with Google
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-6">
              <div>
                <h2 className="text-3xl font-heading text-foreground">Start Your 7-Day Trial</h2>
                <p className="text-muted-foreground mt-1">$7 for 7 days, then $27/month. Cancel anytime.</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="font-heading text-xs tracking-wider text-muted-foreground">First Name</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First" className="bg-muted border-border h-12" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-heading text-xs tracking-wider text-muted-foreground">Last Name</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last" className="bg-muted border-border h-12" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-heading text-xs tracking-wider text-muted-foreground">Email</Label>
                  <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="you@example.com" className="bg-muted border-border h-12" required />
                </div>
                <div className="space-y-2">
                  <Label className="font-heading text-xs tracking-wider text-muted-foreground">Password</Label>
                  <Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="••••••••" className="bg-muted border-border h-12" required minLength={6} />
                  {signupPassword && (
                    <div className="space-y-1">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${strength.color} transition-all duration-300 rounded-full`} style={{ width: strength.width }} />
                      </div>
                      <p className="text-xs text-muted-foreground">{strength.level}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="font-heading text-xs tracking-wider text-muted-foreground">Position</Label>
                  <select value={position} onChange={(e) => setPosition(e.target.value)} className="flex h-12 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">
                    <option value="">Select position</option>
                    <option value="pg">Point Guard (PG)</option>
                    <option value="sg">Shooting Guard (SG)</option>
                    <option value="sf">Small Forward (SF)</option>
                    <option value="pf">Power Forward (PF)</option>
                    <option value="c">Center (C)</option>
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-12 btn-cta bg-primary hover:bg-primary/90 glow-red-hover text-base">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue to Payment <ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
