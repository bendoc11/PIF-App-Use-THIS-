import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Creator {
  id: string;
  first_name: string | null;
  last_name: string | null;
  banned: boolean;
  created_at: string;
}

export default function AdminCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCreators = async () => {
    setLoading(true);
    const { data, error } = await (supabase
      .from("profiles")
      .select("id, first_name, last_name, banned, created_at") as any)
      .eq("role", "creator")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading creators", description: error.message, variant: "destructive" });
    }
    setCreators((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCreators();
  }, []);

  const toggleSuspend = async (creator: Creator) => {
    const newBanned = !creator.banned;
    const { error } = await supabase
      .from("profiles")
      .update({ banned: newBanned } as any)
      .eq("id", creator.id);
    if (error) {
      toast({ title: "Error updating creator", description: error.message, variant: "destructive" });
      return;
    }
    setCreators((prev) => prev.map((c) => (c.id === creator.id ? { ...c, banned: newBanned } : c)));
    toast({ title: newBanned ? "Creator suspended" : "Creator reactivated" });
  };

  const deleteCreator = async (id: string) => {
    if (!confirm("Delete this creator account? This cannot be undone.")) return;
    // Downgrade to user role instead of deleting the profile
    const { error } = await supabase
      .from("profiles")
      .update({ role: "user" } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setCreators((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Creator role removed" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-heading text-foreground">Creator Management</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No creators yet. Assign the "creator" role to a user in the database to get started.</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-heading tracking-wider">Name</TableHead>
                  <TableHead className="font-heading tracking-wider">Status</TableHead>
                  <TableHead className="font-heading tracking-wider">Joined</TableHead>
                  <TableHead className="font-heading tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creators.map((creator) => (
                  <TableRow key={creator.id} className="border-border">
                    <TableCell className="font-medium text-foreground">
                      {creator.first_name} {creator.last_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={creator.banned ? "destructive" : "default"}
                        className={`font-heading tracking-wider text-xs ${
                          !creator.banned ? "bg-pif-green/20 text-pif-green border-pif-green/30" : ""
                        }`}
                      >
                        {creator.banned ? "Suspended" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(creator.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => toggleSuspend(creator)}>
                          {creator.banned ? "Reactivate" : "Suspend"}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteCreator(creator.id)}>
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
