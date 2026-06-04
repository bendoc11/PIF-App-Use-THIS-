import { useState, useEffect } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";


export default function Login() {
  const { user, loading, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab: "signin" | "signup" = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const [tab, setTab] = useState<"signin" | "signup">(initialTab);

  // Keep tab in sync if user navigates between /login and /login?mode=signin
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signin") setTab("signin");
    else if (mode === "signup") setTab("signup");
  }, [searchParams]);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  useEffect(() => {
    const handleBanned = () => {
      toast.error("Your account has been suspended. Please contact support.", { duration: 8000 });
    };
    window.addEventListener("account-banned", handleBanned);
    return () => window.removeEventListener("account-banned", handleBanned);
  }, []);

  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (user && profile) {
    // Always send signed-in users to /dashboard. AuthGuard will display
    // the paywall overlay if they don't have an active subscription.
    return <Navigate to="/dashboard" replace />;
  }

  const getPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: "Weak", color: "bg-[#E8391D]", width: "25%" };
    if (score <= 2) return { level: "Fair", color: "bg-yellow-500", width: "50%" };
    if (score <= 3) return { level: "Good", color: "bg-[#3B82F6]", width: "75%" };
    return { level: "Strong", color: "bg-green-500", width: "100%" };
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    // Kill any existing session before signing in. Otherwise a previous
    // tester's session in the same browser could remain authenticated if
    // the new sign-in fails, causing the app to load that prior user's
    // data (e.g. "Zac Ervin" appearing on a fresh tester's profile).
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setIsLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Existing users land on dashboard. AuthGuard will show the paywall
    // overlay if they don't have an active subscription.
    navigate("/dashboard", { replace: true });
  };

  // Google sign-in temporarily disabled. Flip this flag to re-enable.
  const SHOW_GOOGLE_SIGNIN = false;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setIsLoading(false);
    if (result.error) {
      toast.error(result.error.message || "Google sign-in failed");
    }
    // If successful, the browser redirects — no further action needed.
  };

  const handleSignUp = async (e: React.FormEvent) => {
    if (!signupEmail.trim() || !signupPassword.trim() || !firstName.trim()) return;
    setIsLoading(true);

    try {
      // CRITICAL: kill any existing session first. Otherwise a previous
      // tester's session could remain authenticated even though the new
      // signup uses a different email — the app would then load the
      // previous user's profile (e.g. showing "Zac Ervin" on /my-profile).
      await supabase.auth.signOut();

      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const fullName = `${trimmedFirst} ${trimmedLast}`.trim();

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password: signupPassword,
        options: {
          data: {
            first_name: trimmedFirst,
            last_name: trimmedLast,
            full_name: fullName,
            display_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!signUpData?.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: signupEmail.trim(),
          password: signupPassword,
        });
        if (signInError) throw signInError;
      }

      // Belt-and-suspenders: ensure first/last name are saved to the profile row
      // immediately after signup, even if the handle_new_user trigger raced or
      // metadata was missed. RLS allows users to update their own profile.
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.id) {
        // Partner referral attribution
        const referralSlug = localStorage.getItem("referral_slug");
        let partner_id: string | null = null;
        if (referralSlug) {
          const { data: partner } = await supabase
            .from("partners")
            .select("id")
            .eq("slug", referralSlug)
            .eq("active", true)
            .maybeSingle();
          partner_id = partner?.id || null;
        }
        await supabase
          .from("profiles")
          .update({
            first_name: trimmedFirst,
            last_name: trimmedLast,
            email: signupEmail.trim(),
            ...(partner_id ? { partner_id, referral_slug: referralSlug } : {}),
          })
          .eq("id", currentUser.id);
        if (partner_id) localStorage.removeItem("referral_slug");
      }

      // New user → send to dashboard. AuthGuard will render the paywall
      // since they don't have an active subscription yet. They click the
      // CTA themselves to go to Stripe.
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast.error(err.message || "Could not create account");
      setIsLoading(false);
    }
  };

  const strength = getPasswordStrength(signupPassword);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0A0F1E' }}>
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center" style={{ backgroundColor: '#0A0F1E' }}>
        {/* Subtle electric blue glow top-left */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }} />
        {/* Faint watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
          <span className="font-display text-[20rem] leading-none text-white select-none">OFF</span>
        </div>

        <div className="relative z-10 px-12 space-y-8 max-w-lg">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8391D' }}>
            <span className="font-heading text-xl text-white">OFF</span>
          </div>

          <h1 className="font-display text-5xl xl:text-6xl text-white leading-none tracking-tight">
            YOUR RECRUITING<br />JOURNEY<br />
            <span style={{ color: '#3B82F6' }}>STARTS HERE.</span>
          </h1>

              <p className="text-base leading-relaxed" style={{ color: '#A0ADB8' }}>
            Build your recruiting profile, access elite coaching, and reach every college coach in the country — all in one place.
          </p>

          <div className="space-y-3">
            {[
              '1,852 college programs in our database',
              '7,819 coach emails, all divisions',
            ].map((line, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-bold" style={{ color: '#3B82F6' }}>—</span>
                <span className="text-sm text-white/80">{line}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-8">
            {["ZE", "AW", "TW", "HM"].map((initials, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full border-2 flex items-center justify-center -ml-2 first:ml-0"
                style={{ backgroundColor: '#111827', borderColor: '#0A0F1E' }}
              >
                <span className="text-xs font-heading" style={{ color: '#A0ADB8' }}>{initials}</span>
              </div>
            ))}
            <div
              className="w-10 h-10 rounded-full border-2 flex items-center justify-center -ml-2"
              style={{ backgroundColor: 'rgba(59,130,246,0.2)', borderColor: '#0A0F1E' }}
            >
              <span className="text-xs font-heading" style={{ color: '#3B82F6' }}>+50</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm" style={{ color: '#A0ADB8' }}>
            <span><strong className="text-white">2,400+</strong> Players Already Recruited</span>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12" style={{ backgroundColor: '#111827' }}>
        <div className="w-full max-w-md space-y-8">
          {/* Tab Switcher */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#0A0F1E' }}>
            <button
              onClick={() => setTab("signin")}
              className={`flex-1 py-2.5 rounded-lg font-heading text-sm tracking-wider transition-all ${
                tab === "signin"
                  ? "text-white shadow-sm"
                  : ""
              }`}
              style={{
                backgroundColor: tab === "signin" ? '#111827' : 'transparent',
                color: tab === "signin" ? '#fff' : '#A0ADB8',
              }}
            >
              SIGN IN
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 py-2.5 rounded-lg font-heading text-sm tracking-wider transition-all ${
                tab === "signup"
                  ? "text-white shadow-sm"
                  : ""
              }`}
              style={{
                backgroundColor: tab === "signup" ? '#111827' : 'transparent',
                color: tab === "signup" ? '#fff' : '#A0ADB8',
              }}
            >
              GET RECRUITED
            </button>
          </div>

          {tab === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <h2 className="text-3xl font-heading text-white tracking-tight">WELCOME BACK</h2>
                <p className="mt-1" style={{ color: '#A0ADB8' }}>Continue your recruiting journey.</p>
              </div>
              {SHOW_GOOGLE_SIGNIN && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full h-12 font-heading tracking-wider border text-white hover:bg-white/5"
                    style={{ borderColor: 'rgba(59,130,246,0.3)', backgroundColor: '#0A0F1E' }}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.33v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.11z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }} />
                    <span className="text-xs font-heading tracking-wider" style={{ color: '#A0ADB8' }}>OR</span>
                    <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }} />
                  </div>
                </>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-heading text-xs tracking-wider" style={{ color: '#A0ADB8' }}>EMAIL</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 border text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-offset-0"
                    style={{ backgroundColor: '#0A0F1E', borderColor: 'rgba(59,130,246,0.3)' }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-heading text-xs tracking-wider" style={{ color: '#A0ADB8' }}>PASSWORD</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 border pr-10 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-offset-0"
                      style={{ backgroundColor: '#0A0F1E', borderColor: 'rgba(59,130,246,0.3)' }}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-xs hover:underline"
                    style={{ color: '#3B82F6' }}
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
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-heading tracking-wider text-white border-0"
                style={{ backgroundColor: '#E8391D' }}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>SIGN IN <ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-6">
              <div>
                <h2 className="text-2xl font-heading text-white tracking-tight">BUILD YOUR RECRUITING PROFILE</h2>
                <p className="mt-1" style={{ color: '#A0ADB8' }}>Get in front of every college coach.</p>
              </div>
              {SHOW_GOOGLE_SIGNIN && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full h-12 font-heading tracking-wider border text-white hover:bg-white/5"
                    style={{ borderColor: 'rgba(59,130,246,0.3)', backgroundColor: '#0A0F1E' }}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.33v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.11z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }} />
                    <span className="text-xs font-heading tracking-wider" style={{ color: '#A0ADB8' }}>OR</span>
                    <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }} />
                  </div>
                </>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="font-heading text-xs tracking-wider" style={{ color: '#A0ADB8' }}>FIRST NAME</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First"
                      className="h-12 border text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-offset-0"
                      style={{ backgroundColor: '#0A0F1E', borderColor: 'rgba(59,130,246,0.3)' }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-heading text-xs tracking-wider" style={{ color: '#A0ADB8' }}>LAST NAME</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last"
                      className="h-12 border text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-offset-0"
                      style={{ backgroundColor: '#0A0F1E', borderColor: 'rgba(59,130,246,0.3)' }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-heading text-xs tracking-wider" style={{ color: '#A0ADB8' }}>EMAIL</Label>
                  <Input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 border text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-offset-0"
                    style={{ backgroundColor: '#0A0F1E', borderColor: 'rgba(59,130,246,0.3)' }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-heading text-xs tracking-wider" style={{ color: '#A0ADB8' }}>PASSWORD</Label>
                  <Input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 border text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-offset-0"
                    style={{ backgroundColor: '#0A0F1E', borderColor: 'rgba(59,130,246,0.3)' }}
                    required
                    minLength={6}
                  />
                  {signupPassword && (
                    <div className="space-y-1">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#0A0F1E' }}>
                        <div className={`h-full ${strength.color} transition-all duration-300 rounded-full`} style={{ width: strength.width }} />
                      </div>
                      <p className="text-xs" style={{ color: '#A0ADB8' }}>{strength.level}</p>
                    </div>
                  )}
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-heading tracking-wider text-white border-0"
                style={{ backgroundColor: '#E8391D' }}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>START FOR FREE <ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>
              <p className="text-xs text-center" style={{ color: '#A0ADB8' }}>
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
