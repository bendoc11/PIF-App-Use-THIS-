import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function AddOfferDialog({ open, onOpenChange, onSaved }: Props) {
  const { user } = useAuth();
  const [school, setSchool] = useState("");
  const [coach, setCoach] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const reset = () => { setSchool(""); setCoach(""); setDate(new Date().toISOString().slice(0, 10)); };

  const save = async () => {
    if (!user) return;
    if (!school.trim() || !coach.trim()) {
      toast({ title: "Missing info", description: "School and coach name are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("recruiting_offers").insert({
      user_id: user.id,
      school_name: school.trim(),
      coach_name: coach.trim(),
      offer_date: date,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Offer added 🎉", description: `${school} — ${coach}` });
    reset();
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Add an offer</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div>
            <Label htmlFor="school" className="text-gray-700 text-sm">School name</Label>
            <Input id="school" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Duke University" className="bg-white text-gray-900" />
          </div>
          <div>
            <Label htmlFor="coach" className="text-gray-700 text-sm">Coach who offered</Label>
            <Input id="coach" value={coach} onChange={(e) => setCoach(e.target.value)} placeholder="Jon Scheyer" className="bg-white text-gray-900" />
          </div>
          <div>
            <Label htmlFor="date" className="text-gray-700 text-sm">Date of offer</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white text-gray-900" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300">Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? "Saving…" : "Save offer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
