import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileSheet({ open, onOpenChange }: EditProfileSheetProps) {
  const { user, profile, refreshProfile } = useAuth();
  const p: any = profile || {};

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    position: "",
    grad_year: "",
    height: "",
    weight: "",
    gpa: "",
    city: "",
    state: "",
    high_school_name: "",
    bio: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        position: (p.positions?.length ? p.positions.join(" / ") : p.position) || "",
        grad_year: p.grad_year ? String(p.grad_year) : "",
        height: p.height || "",
        weight: p.weight || "",
        gpa: p.gpa != null ? String(p.gpa) : "",
        city: p.city || "",
        state: p.state || "",
        high_school_name: p.high_school_name || "",
        bio: p.bio || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updates: Record<string, any> = {
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        position: form.position.trim() || null,
        grad_year: form.grad_year ? parseInt(form.grad_year, 10) || null : null,
        height: form.height.trim() || null,
        weight: form.weight.trim() || null,
        gpa: form.gpa ? parseFloat(form.gpa) || null : null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        high_school_name: form.high_school_name.trim() || null,
        bio: form.bio.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) throw error;

      await refreshProfile();
      toast.success("Profile updated");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Profile update failed:", err);
      toast.error(err?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto bg-card border-border/60"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-foreground">Edit Profile</SheetTitle>
          <SheetDescription>
            Update the info coaches see on your profile.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" value={form.first_name} onChange={set("first_name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" value={form.last_name} onChange={set("last_name")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="position">Position</Label>
              <Input id="position" placeholder="PG / SG" value={form.position} onChange={set("position")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grad_year">Grad year</Label>
              <Input id="grad_year" inputMode="numeric" placeholder="2027" value={form.grad_year} onChange={set("grad_year")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="height">Height</Label>
              <Input id="height" placeholder="6'2&quot;" value={form.height} onChange={set("height")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weight">Weight</Label>
              <Input id="weight" placeholder="180 lbs" value={form.weight} onChange={set("weight")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gpa">GPA</Label>
              <Input id="gpa" inputMode="decimal" placeholder="3.8" value={form.gpa} onChange={set("gpa")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="high_school_name">School</Label>
            <Input id="high_school_name" value={form.high_school_name} onChange={set("high_school_name")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={set("city")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" placeholder="CA" value={form.state} onChange={set("state")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={5}
              placeholder="Tell coaches about your game, work ethic, and goals."
              value={form.bio}
              onChange={set("bio")}
            />
          </div>
        </div>

        <SheetFooter className="flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
