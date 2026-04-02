import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { User, Camera, Loader2 } from "lucide-react";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";

export default function Settings() {
  const { profile, user } = useAuth();
  const { uploading, openFilePicker } = useAvatarUpload();

  const initials = [profile?.first_name?.[0], profile?.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";

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
              ) : profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
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
              <span className="text-foreground">{profile?.first_name} {profile?.last_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{user?.email}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
