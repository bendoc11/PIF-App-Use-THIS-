import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useSearchParams } from "react-router-dom";

const GOOGLE_CLIENT_ID = "617641714400-jjlh0v9fpecmc6a4ccikrkure3bn8kmg.apps.googleusercontent.com";
// Redirect URI must match what's registered in Google Cloud Console.
// Using playitforward.app so the consent screen shows our brand domain.
const REDIRECT_URI = "https://playitforward.app/gmail/callback";
const SCOPE = "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email";

export function GmailConnectCard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchStatus = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("get_gmail_connection");
    if (error) {
      console.error("[Gmail] status fetch error", error);
    }
    setConnectedEmail(data?.[0]?.email ?? null);
    setLoading(false);
  };

  useEffect(() => { fetchStatus(); }, [user]);

  // Surface OAuth callback result from URL params
  useEffect(() => {
    const status = searchParams.get("gmail");
    if (!status) return;
    if (status === "connected") {
      toast({ title: "Gmail connected", description: "You can now send emails from your Gmail." });
      fetchStatus();
    } else if (status === "error") {
      const msg = searchParams.get("msg");
      toast({
        title: "Gmail connection failed",
        description: msg || "Please try again.",
        variant: "destructive",
      });
    }
    searchParams.delete("gmail");
    searchParams.delete("msg");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams]);

  const handleConnect = async () => {
    if (!user) return;
    setConnecting(true);
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPE);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", user.id);

    if (Capacitor.isNativePlatform()) {
      // Open in in-app browser; user lands on /settings?gmail=connected after redirect
      await Browser.open({ url: url.toString() });
      setConnecting(false);
    } else {
      window.location.href = url.toString();
    }
  };

  const handleSendTest = async () => {
    setSendingTest(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const res = await supabase.functions.invoke("send-gmail", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          to: "bdaugherty216@gmail.com",
          subject: "Test from Play it Forward",
          body: "Gmail send is working.",
        },
      });
      if (res.error) throw res.error;
      const data = res.data as { success?: boolean; from?: string; message_id?: string; error?: string };
      if (!data?.success) throw new Error(data?.error || "Send failed");
      toast({
        title: "Test email sent",
        description: `From ${data.from} → bdaugherty216@gmail.com`,
      });
    } catch (e: any) {
      toast({ title: "Send failed", description: e.message || "Unknown error", variant: "destructive" });
    } finally {
      setSendingTest(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const res = await supabase.functions.invoke("gmail-disconnect", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error) throw res.error;
      setConnectedEmail(null);
      toast({ title: "Gmail disconnected" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to disconnect", variant: "destructive" });
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-heading">
          <Mail className="h-5 w-5 text-primary" /> Email Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Connect your Gmail to send recruiting emails to coaches from your own address. Replies go to your inbox.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking connection…
          </div>
        ) : connectedEmail ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-foreground">Connected as</span>
              <span className="text-primary font-medium">{connectedEmail}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleSendTest}
                disabled={sendingTest}
              >
                {sendingTest ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                Send test email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
                Disconnect Gmail
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={handleConnect} disabled={connecting}>
            {connecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
            Connect Gmail
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
