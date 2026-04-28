import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  /** username preferred, falls back to user id */
  identifier: string | null | undefined;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function ShareProfileButton({ identifier, className, size = "default" }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!identifier) {
      toast({
        title: "Profile not ready yet",
        description: "Finish a few profile fields, then share with coaches.",
      });
      return;
    }
    const url = `${window.location.origin}/p/${identifier}`;

    // Try native share first on mobile, then clipboard
    try {
      if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        await navigator.share({
          title: "My recruiting profile",
          text: "Take a look at my recruiting profile.",
          url,
        });
        return;
      }
    } catch {
      // user cancelled — fall through to clipboard
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Profile link copied",
        description: "Paste it into your next coach email.",
      });
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast({
        title: "Couldn't copy automatically",
        description: url,
      });
    }
  };

  return (
    <Button
      onClick={handleShare}
      size={size}
      className={cn(
        "rounded-lg font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_24px_-6px_hsl(var(--pif-red)/0.7)]",
        "transition-all hover:shadow-[0_0_28px_-4px_hsl(var(--pif-red)/0.9)]",
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Link copied
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Share Profile
        </>
      )}
    </Button>
  );
}
