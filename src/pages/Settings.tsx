import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { User, Camera, Loader2, Trash2 } from "lucide-react";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { GmailConnectCard } from "@/components/settings/GmailConnectCard";

export default function Settings() {
  const { profile, user, signOut } = useAuth();
  const { uploading, openFilePicker } = useAvatarUpload();
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  // Only trust profile data when it matches the currently authenticated
  // user. Otherwise a stale profile from a previous tester in the same
  // browser tab could leak through (e.g. wrong name shown next to the
  // logged-in email).
  const profileMatchesUser = !!(profile && user && (profile as any).id === user.id);
  const safeFirstName = profileMatchesUser ? profile?.first_name : null;
  const safeLastName = profileMatchesUser ? profile?.last_name : null;
  const safeAvatar = profileMatchesUser ? profile?.avatar_url : null;
  const initials = [safeFirstName?.[0], safeLastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw res.error;

      await signOut();
      navigate("/");
      toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete account", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-heading text-foreground">Settings</h1>

        {/* Profile Photo */}
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center py-6">
            <button
              onClick={openFilePicker}
              disabled={uploading}
              className="relative w-[100px] h-[100px] rounded-full border-2 border-primary/30 bg-muted flex items-center justify-center overflow-hidden group cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : safeAvatar ? (
                <img src={safeAvatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-heading text-primary">{initials}</span>
              )}
              {!uploading && (
                <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg border-2 border-background">
                  <Camera className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </button>
            <p className="text-sm text-muted-foreground mt-3">Tap to change photo</p>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-heading">
              <User className="h-5 w-5 text-primary" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="text-foreground">{[safeFirstName, safeLastName].filter(Boolean).join(" ") || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{user?.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* Sport */}
        <SportCard />

        {/* Gmail Connection — hidden for App Store review */}
        {/* <GmailConnectCard /> */}

        {/* Delete Account */}
        <Card className="bg-card border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-heading text-destructive">
              <Trash2 className="h-5 w-5" /> Delete Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account, profile, training history, and all associated data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function SportCard() {
  const { profile, user, refreshProfile } = useAuth();
  const [changing, setChanging] = useState(false);
  const [open, setOpen] = useState(false);
  const sport = (profile as any)?.sport as string | null | undefined;
  const label =
    sport === "womens_basketball"
      ? "Women's Basketball"
      : sport === "mens_basketball"
      ? "Men's Basketball"
      : "—";

  const change = async (next: "mens_basketball" | "womens_basketball") => {
    if (!user || next === sport) {
      setOpen(false);
      return;
    }
    setChanging(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ sport: next })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: "Sport updated", description: "Your coach database has been updated. Sent message history is preserved." });
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Couldn't update sport", description: e.message, variant: "destructive" });
    } finally {
      setChanging(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-heading">
          Sport
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Current</span>
          <div className="flex items-center gap-3">
            <span className="text-foreground">{label}</span>
            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogTrigger asChild>
                <button className="text-primary text-xs font-heading tracking-wider hover:underline">
                  CHANGE
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Change your sport?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Changing your sport will update your coach database. Your sent
                    message history will be preserved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col gap-2 my-2">
                  <Button
                    variant={sport === "mens_basketball" ? "default" : "outline"}
                    onClick={() => change("mens_basketball")}
                    disabled={changing}
                  >
                    Men's Basketball
                  </Button>
                  <Button
                    variant={sport === "womens_basketball" ? "default" : "outline"}
                    onClick={() => change("womens_basketball")}
                    disabled={changing}
                  >
                    Women's Basketball
                  </Button>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={changing}>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
