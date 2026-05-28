import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Copy, Plus, Pencil, FileText, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Partner {
  id: string;
  slug: string;
  partner_name: string;
  logo_url: string | null;
  primary_color: string | null;
  contact_name: string | null;
  contact_email: string | null;
  commission_per_subscriber: number;
  active: boolean;
}

interface PartnerForm {
  id?: string;
  slug: string;
  partner_name: string;
  logo_url: string;
  primary_color: string;
  contact_name: string;
  contact_email: string;
  commission_per_subscriber: number;
  active: boolean;
}

const emptyForm: PartnerForm = {
  slug: "",
  partner_name: "",
  logo_url: "",
  primary_color: "#dc2626",
  contact_name: "",
  contact_email: "",
  commission_per_subscriber: 50,
  active: true,
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

const baseUrl = () =>
  typeof window !== "undefined" ? `${window.location.origin}` : "https://offered.pro";

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PartnerForm | null>(null);
  const [reportPartner, setReportPartner] = useState<Partner | null>(null);
  const [reportRows, setReportRows] = useState<any[]>([]);
  const [savedLink, setSavedLink] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: ps } = await supabase
      .from("partners")
      .select("*")
      .order("created_at", { ascending: false });
    const list = (ps || []) as Partner[];
    setPartners(list);

    const counts: Record<string, number> = {};
    await Promise.all(
      list.map(async (p) => {
        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("partner_id", p.id);
        counts[p.id] = count || 0;
      })
    );
    setCounts(counts);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => setEditing({ ...emptyForm });
  const openEdit = (p: Partner) =>
    setEditing({
      id: p.id,
      slug: p.slug,
      partner_name: p.partner_name,
      logo_url: p.logo_url || "",
      primary_color: p.primary_color || "#dc2626",
      contact_name: p.contact_name || "",
      contact_email: p.contact_email || "",
      commission_per_subscriber: Number(p.commission_per_subscriber) || 50,
      active: p.active,
    });

  const handleLogoUpload = async (file: File) => {
    if (!editing) return;
    const slug = editing.slug || slugify(editing.partner_name) || crypto.randomUUID();
    const ext = file.name.split(".").pop() || "png";
    const path = `${slug}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("partner-logos")
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("partner-logos").getPublicUrl(path);
    setEditing({ ...editing, logo_url: data.publicUrl });
    toast.success("Logo uploaded");
  };

  const handleSave = async () => {
    if (!editing) return;
    const slug = editing.slug.trim() || slugify(editing.partner_name);
    if (!slug || !editing.partner_name.trim()) {
      toast.error("Name and slug required");
      return;
    }
    const payload = {
      slug,
      partner_name: editing.partner_name.trim(),
      logo_url: editing.logo_url.trim() || null,
      primary_color: editing.primary_color,
      contact_name: editing.contact_name.trim() || null,
      contact_email: editing.contact_email.trim() || null,
      commission_per_subscriber: editing.commission_per_subscriber,
      active: editing.active,
    };
    let error;
    if (editing.id) {
      ({ error } = await supabase.from("partners").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("partners").insert(payload));
    }
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Partner saved");
    setSavedLink(`${baseUrl()}/${slug}`);
    setEditing(null);
    load();
  };

  const openReport = async (p: Partner) => {
    setReportPartner(p);
    const { data } = await supabase
      .from("profiles")
      .select("id,first_name,last_name,email,created_at,subscription_status")
      .eq("partner_id", p.id)
      .order("created_at", { ascending: false });
    setReportRows(data || []);
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${baseUrl()}/${slug}`);
    toast.success("Link copied");
  };

  const markPaid = async (p: Partner) => {
    const activeCount = reportRows.filter((r) => r.subscription_status === "active").length;
    const amount = activeCount * Number(p.commission_per_subscriber);
    const month = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("monthly_commissions").insert({
      partner_id: p.id,
      month,
      active_subscribers: activeCount,
      commission_amount: amount,
      paid: true,
      paid_at: new Date().toISOString(),
    });
    if (error) toast.error(error.message);
    else toast.success(`Recorded payment of $${amount.toFixed(2)}`);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Partners</h1>
          <p className="text-sm text-muted-foreground">White-label referral programs</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Partner</Button>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner</TableHead>
              <TableHead>Referral Link</TableHead>
              <TableHead>Logo</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Subscribers</TableHead>
              <TableHead>Owed / mo</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : partners.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No partners yet</TableCell></TableRow>
            ) : partners.map((p) => {
              const count = counts[p.id] || 0;
              const owed = count * Number(p.commission_per_subscriber);
              const link = `${baseUrl()}/${p.slug}`;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.partner_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <a href={`/${p.slug}`} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs">{link}</a>
                      <button onClick={() => copyLink(p.slug)} className="p-1 hover:bg-muted rounded"><Copy className="h-3 w-3" /></button>
                    </div>
                  </TableCell>
                  <TableCell>{p.logo_url ? <img src={p.logo_url} alt="" className="h-6 w-auto" /> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{p.active ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />}</TableCell>
                  <TableCell>{count}</TableCell>
                  <TableCell>${owed.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{p.contact_email || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => openReport(p)}><FileText className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit / New */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit Partner" : "Add Partner"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Partner Name</Label>
                <Input
                  value={editing.partner_name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setEditing({
                      ...editing,
                      partner_name: name,
                      slug: editing.id ? editing.slug : slugify(name),
                    });
                  }}
                />
              </div>
              <div>
                <Label>Slug</Label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{baseUrl()}/</span>
                  <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>Logo URL</Label>
                <Input value={editing.logo_url} onChange={(e) => setEditing({ ...editing, logo_url: e.target.value })} placeholder="https://..." />
                {editing.logo_url && <img src={editing.logo_url} alt="" className="h-10 mt-2" />}
              </div>
              <div>
                <Label>Or upload logo</Label>
                <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Primary Color</Label>
                  <Input type="color" value={editing.primary_color} onChange={(e) => setEditing({ ...editing, primary_color: e.target.value })} />
                </div>
                <div>
                  <Label>Commission ($/sub)</Label>
                  <Input type="number" value={editing.commission_per_subscriber} onChange={(e) => setEditing({ ...editing, commission_per_subscriber: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Contact Name</Label>
                  <Input value={editing.contact_name} onChange={(e) => setEditing({ ...editing, contact_name: e.target.value })} />
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <Input type="email" value={editing.contact_email} onChange={(e) => setEditing({ ...editing, contact_email: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center justify-between border border-border rounded-md px-3 py-2">
                <Label>Active</Label>
                <Switch checked={editing.active} onCheckedChange={(c) => setEditing({ ...editing, active: c })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saved link confirmation */}
      <Dialog open={!!savedLink} onOpenChange={(o) => !o && setSavedLink(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Partner saved</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Share this referral link:</p>
          <div className="flex items-center gap-2 mt-2 p-3 border border-border rounded bg-muted/30">
            <code className="text-sm flex-1 break-all">{savedLink}</code>
            <Button size="sm" onClick={() => { navigator.clipboard.writeText(savedLink!); toast.success("Copied"); }}><Copy className="h-3 w-3" /></Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report */}
      <Dialog open={!!reportPartner} onOpenChange={(o) => !o && setReportPartner(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{reportPartner?.partner_name} — Subscribers</DialogTitle></DialogHeader>
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Signup</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Commission</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {reportRows.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No subscribers yet</TableCell></TableRow>
                ) : reportRows.map((r) => {
                  const active = r.subscription_status === "active";
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}</TableCell>
                      <TableCell className="text-xs">{r.email || "—"}</TableCell>
                      <TableCell className="text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="text-xs">{r.subscription_status || "inactive"}</TableCell>
                      <TableCell className="text-right">{active ? `$${Number(reportPartner?.commission_per_subscriber || 0).toFixed(2)}` : "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportPartner(null)}>Close</Button>
            {reportPartner && <Button onClick={() => markPaid(reportPartner)}>Mark this month as Paid</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
