import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Smartphone, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  if (isStandalone) {
    return (
      <AppLayout>
        <div className="p-6 max-w-md mx-auto text-center space-y-4 pt-20">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-heading text-foreground">Already Installed</h1>
          <p className="text-muted-foreground">You're using the app right now!</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 max-w-lg mx-auto space-y-6 pt-10">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <span className="font-heading text-2xl text-primary-foreground">PIF</span>
          </div>
          <h1 className="text-3xl font-heading text-foreground">Install PIF Training</h1>
          <p className="text-muted-foreground">Add to your home screen for the full experience — fast, offline-ready, no app store needed.</p>
        </div>

        {installed ? (
          <Card className="bg-card border-primary/20">
            <CardContent className="p-6 text-center space-y-2">
              <Check className="h-8 w-8 text-primary mx-auto" />
              <p className="font-heading text-foreground">App installed!</p>
              <p className="text-sm text-muted-foreground">Open it from your home screen.</p>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Button onClick={handleInstall} className="w-full btn-cta bg-primary hover:bg-primary/90 glow-red-hover h-14 text-lg">
            <Download className="h-5 w-5 mr-2" /> Install App
          </Button>
        ) : isIOS ? (
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-heading text-foreground text-lg">Install on iPhone / iPad</h2>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-heading text-xs">1</span>
                  Tap the <strong className="text-foreground">Share</strong> button in Safari (the square with an arrow)
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-heading text-xs">2</span>
                  Scroll down and tap <strong className="text-foreground">Add to Home Screen</strong>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-heading text-xs">3</span>
                  Tap <strong className="text-foreground">Add</strong> to confirm
                </li>
              </ol>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-heading text-foreground text-lg">Install on Android</h2>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-heading text-xs">1</span>
                  Tap the <strong className="text-foreground">menu</strong> (three dots) in Chrome
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-heading text-xs">2</span>
                  Tap <strong className="text-foreground">Add to Home Screen</strong> or <strong className="text-foreground">Install App</strong>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-heading text-xs">3</span>
                  Tap <strong className="text-foreground">Install</strong> to confirm
                </li>
              </ol>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { icon: Smartphone, label: "Works offline" },
            { icon: Download, label: "No app store" },
            { icon: Check, label: "Always updated" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
