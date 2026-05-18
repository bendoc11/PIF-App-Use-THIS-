import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  Send,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Mail,
  Plus,
} from "lucide-react";

type Template = "outreach" | "reply" | "custom";

interface TestContact {
  id: string;
  name: string;
  email: string;
  notes: string | null;
  times_emailed: number;
  last_replied_at: string | null;
  created_at: string;
}

interface SendRow {
  id: string;
  recipient_name: string | null;
  recipient_email: string;
  template: string;
  sent_at: string;
  replied: boolean;
  replied_at: string | null;
}

const SENDER_DOMAIN = "mail.playitforward.app";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function AdminDeliverability() {
  // Quick send state
  const [qsTo, setQsTo] = useState("");
  const [qsName, setQsName] = useState("");
  const [qsTemplate, setQsTemplate] = useState<Template>("outreach");
  const [qsSubject, setQsSubject] = useState("");
  const [qsBody, setQsBody] = useState("");
  const [sending, setSending] = useState(false);
  const [lastSend, setLastSend] = useState<{ to: string; at: string } | null>(null);

  // Contacts
  const [contacts, setContacts] = useState<TestContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [addingContact, setAddingContact] = useState(false);

  // History
  const [sends, setSends] = useState<SendRow[]>([]);
  const [sendsLoading, setSendsLoading] = useState(true);

  async function loadContacts() {
    setContactsLoading(true);
    const { data, error } = await supabase
      .from("test_contacts" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load contacts", description: error.message, variant: "destructive" });
    } else {
      setContacts((data as any) || []);
    }
    setContactsLoading(false);
  }

  async function loadSends() {
    setSendsLoading(true);
    const { data, error } = await supabase
      .from("test_email_sends" as any)
      .select("id, recipient_name, recipient_email, template, sent_at, replied, replied_at")
      .order("sent_at", { ascending: false })
      .limit(100);
    if (error) {
      toast({ title: "Failed to load history", description: error.message, variant: "destructive" });
    } else {
      setSends((data as any) || []);
    }
    setSendsLoading(false);
  }

  useEffect(() => {
    loadContacts();
    loadSends();
  }, []);

  async function handleSend(opts?: { to: string; name: string; contactId?: string }) {
    const to = (opts?.to ?? qsTo).trim();
    const name = (opts?.name ?? qsName).trim();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      toast({ title: "Invalid email", description: "Enter a valid recipient email.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-test-email", {
        body: {
          to,
          name,
          template: qsTemplate,
          subject: qsTemplate === "custom" ? qsSubject : undefined,
          body: qsTemplate === "custom" ? qsBody : undefined,
          contactId: opts?.contactId,
        },
      });
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message || "Send failed");
      }
      const sentAt = new Date().toLocaleTimeString();
      setLastSend({ to, at: sentAt });
      toast({ title: "Test email sent", description: `Sent to ${to}` });
      loadSends();
      loadContacts();
    } catch (e: any) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  async function addContact() {
    if (!newName.trim() || !newEmail.trim()) {
      toast({ title: "Missing fields", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    setAddingContact(true);
    const { error } = await supabase.from("test_contacts" as any).insert({
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      notes: newNotes.trim() || null,
    });
    setAddingContact(false);
    if (error) {
      toast({ title: "Failed to add", description: error.message, variant: "destructive" });
      return;
    }
    setNewName(""); setNewEmail(""); setNewNotes("");
    setAddOpen(false);
    loadContacts();
  }

  async function deleteContact(id: string) {
    if (!confirm("Delete this contact?")) return;
    const { error } = await supabase.from("test_contacts" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      loadContacts();
    }
  }

  function copyWarmup() {
    navigator.clipboard.writeText(`warmup@${SENDER_DOMAIN}`);
    toast({ title: "Copied", description: `warmup@${SENDER_DOMAIN}` });
  }

  // Domain health — SPF/DKIM/DMARC/Warmup. SPF on the subdomain is the only
  // status that meaningfully changes; mark it pending until DNS is fixed.
  const health = [
    { label: "SPF", ok: false, note: "needs sendgrid.net include on mail subdomain" },
    { label: "DKIM", ok: true, note: "s1/s2 selectors verified" },
    { label: "DMARC", ok: true, note: "policy published on root" },
    { label: "Warm-up", ok: true, note: "warmup@ forwarding active" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl tracking-wider text-foreground">Deliverability</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Send test emails, track replies, and monitor sending domain health.
          </p>
        </div>

        {/* #1 — Quick Send */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <Send className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg tracking-wider">Quick Send</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="qs-to" className="text-xs text-muted-foreground">To</Label>
              <Input
                id="qs-to"
                type="email"
                placeholder="coach@example.com"
                value={qsTo}
                onChange={(e) => setQsTo(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="qs-name" className="text-xs text-muted-foreground">Name</Label>
              <Input
                id="qs-name"
                placeholder="Coach Smith"
                value={qsName}
                onChange={(e) => setQsName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground">Template</Label>
              <Select value={qsTemplate} onValueChange={(v) => setQsTemplate(v as Template)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outreach">Recruiting Outreach</SelectItem>
                  <SelectItem value="reply">Coach Reply Test</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {qsTemplate === "custom" && (
              <>
                <div className="md:col-span-2">
                  <Label htmlFor="qs-subj" className="text-xs text-muted-foreground">Subject</Label>
                  <Input
                    id="qs-subj"
                    value={qsSubject}
                    onChange={(e) => setQsSubject(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="qs-body" className="text-xs text-muted-foreground">Body</Label>
                  <Textarea
                    id="qs-body"
                    rows={6}
                    value={qsBody}
                    onChange={(e) => setQsBody(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </>
            )}
          </div>

          <Button
            onClick={() => handleSend()}
            disabled={sending}
            className="mt-5 w-full h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-heading tracking-wider"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
            Send Test Email
          </Button>

          {lastSend && (
            <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              <CheckCircle2 className="inline h-4 w-4 mr-2" />
              Sent to <strong>{lastSend.to}</strong> at <strong>{lastSend.at}</strong> — ask them to reply and mark as not spam.
            </div>
          )}
        </Card>

        {/* #2 — Test Contacts */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg tracking-wider">Test Contacts</h2>
            <Button onClick={() => setAddOpen(true)} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Add Contact
            </Button>
          </div>

          {contactsLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : contacts.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No contacts yet. Add one to start tracking deliverability.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-center">Emailed</TableHead>
                    <TableHead>Last Replied</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(c.created_at)}</TableCell>
                      <TableCell className="text-center">{c.times_emailed}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(c.last_replied_at)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{c.notes || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSend({ to: c.email, name: c.name, contactId: c.id })}
                            disabled={sending}
                          >
                            <Send className="h-3 w-3 mr-1" /> Send Now
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteContact(c.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* #3 — Send History */}
        <Card className="p-6 bg-card border-border">
          <h2 className="font-heading text-lg tracking-wider mb-4">Send History</h2>
          {sendsLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : sends.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No test emails sent yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>To</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Replied</TableHead>
                    <TableHead>Reply Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sends.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div>{s.recipient_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{s.recipient_email}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(s.sent_at)}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{s.template}</Badge></TableCell>
                      <TableCell>
                        {s.replied
                          ? <Badge className="bg-green-500/20 text-green-400 border-green-500/40">Yes</Badge>
                          : <Badge variant="outline" className="text-muted-foreground">No</Badge>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(s.replied_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* #4 — Domain Health */}
        <Card className="p-6 bg-card border-border">
          <h2 className="font-heading text-lg tracking-wider mb-4">Domain Health</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {health.map((h) => (
              <div
                key={h.label}
                className={`rounded-lg border p-4 flex items-center gap-3 ${
                  h.ok ? "border-green-500/30 bg-green-500/5" : "border-destructive/40 bg-destructive/5"
                }`}
              >
                {h.ok
                  ? <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                  : <XCircle className="h-5 w-5 text-destructive shrink-0" />}
                <div className="min-w-0">
                  <div className="font-heading text-sm tracking-wider">{h.label}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{h.note}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Sending domain: <strong className="text-foreground">{SENDER_DOMAIN}</strong>
            </div>
            <Button onClick={copyWarmup} size="sm" variant="outline">
              <Copy className="h-3 w-3 mr-1" /> Copy test address
            </Button>
          </div>
        </Card>

        {/* #5 — Instructions */}
        <Card className="p-6 bg-card/50 border-border border-dashed">
          <h3 className="font-heading text-sm tracking-wider text-muted-foreground mb-3">How to improve deliverability</h3>
          <ol className="space-y-2 text-sm text-foreground/80 list-decimal list-inside">
            <li>Send a test email to someone you know.</li>
            <li>Ask them to reply — even one word is enough.</li>
            <li>Ask them to mark it as <strong>Not Spam</strong> if it landed in spam or Promotions.</li>
            <li>Ask them to move it to their <strong>Primary</strong> inbox.</li>
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">Each reply builds your domain reputation.</p>
        </Card>
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Add Test Contact</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="nc-name" className="text-xs text-muted-foreground">Name</Label>
              <Input id="nc-name" value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="nc-email" className="text-xs text-muted-foreground">Email</Label>
              <Input id="nc-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="nc-notes" className="text-xs text-muted-foreground">Notes</Label>
              <Textarea id="nc-notes" rows={3} value={newNotes} onChange={(e) => setNewNotes(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addContact} disabled={addingContact}>
              {addingContact && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
