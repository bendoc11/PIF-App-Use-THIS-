import { useRef, useState } from "react";
import StepShell, { PrimaryCTA, SkipButton } from "./StepShell";
import { ArrowRight, Camera, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function StepPhoto({
  initialUrl,
  onNext,
  onSkip,
}: {
  initialUrl: string | null;
  onNext: (url: string) => void;
  onSkip: () => void;
}) {
  const { user } = useAuth();
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/profile-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setUrl(data.publicUrl);
      toast.success("Photo uploaded.");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <StepShell
      eyebrow="STEP 5 OF 8 · PHOTO"
      title="Coaches see this first."
      subtitle="Use a clear headshot or action shot. Profiles with photos get significantly more coach views."
      footer={
        <>
          <PrimaryCTA onClick={() => url && onNext(url)} disabled={!url || uploading}>
            NEXT <ArrowRight className="h-4 w-4" />
          </PrimaryCTA>
          <SkipButton onClick={onSkip} label="Skip — I'll add a photo later (you'll get fewer views)" />
        </>
      }
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative aspect-square w-full max-w-sm mx-auto rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
          dragging ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"
        }`}
      >
        {url ? (
          <>
            <img src={url} alt="Profile" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="text-xs text-white/90 font-medium">Tap to replace</span>
              <Camera className="h-4 w-4 text-white" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
            {uploading ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Tap or drop to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG or PNG · up to 10MB</p>
                </div>
              </>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
    </StepShell>
  );
}
