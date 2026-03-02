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
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface UserRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  plan: string;
  banned: boolean;
  created_at: string;
  last_drill_date: string | null;
}

type FilterType = "all" | "active" | "banned" | "free" | "subscribed";

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await (supabase
      .from("profiles")
      .select("id, first_name, last_name, email, plan, banned, created_at, last_drill_date") as any)
      .eq("role", "user")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading users", description: error.message, variant: "destructive" });
    }
    setUsers((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleBan = async (user: UserRow) => {
    const newBanned = !user.banned;
    const { error } = await supabase
      .from("profiles")
      .update({ banned: newBanned } as any)
      .eq("id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, banned: newBanned } : u)));
    toast({ title: newBanned ? "User banned" : "User unbanned" });
  };

  const filtered = users.filter((u) => {
    if (filter === "active") return !u.banned;
    if (filter === "banned") return u.banned;
    if (filter === "free") return u.plan === "free";
    if (filter === "subscribed") return u.plan !== "free";
    return true;
  }).filter((u) => {
    if (!search) return true;
    const searchable = `${u.first_name || ""} ${u.last_name || ""} ${u.email || ""}`.toLowerCase();
    return searchable.includes(search.toLowerCase());
  });

  const filters: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Banned", value: "banned" },
    { label: "Free", value: "free" },
    { label: "Subscribed", value: "subscribed" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-heading text-foreground">User Management</h1>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.value)}
                className="font-heading tracking-wider text-xs"
              >
                {f.label}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-heading tracking-wider">Name</TableHead>
                  <TableHead className="font-heading tracking-wider">Email</TableHead>
                  <TableHead className="font-heading tracking-wider">Plan</TableHead>
                  <TableHead className="font-heading tracking-wider">Status</TableHead>
                  <TableHead className="font-heading tracking-wider">Joined</TableHead>
                  <TableHead className="font-heading tracking-wider">Last Active</TableHead>
                  <TableHead className="font-heading tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id} className="border-border">
                    <TableCell className="font-medium text-foreground">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{user.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-heading tracking-wider text-xs capitalize">
                        {user.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.banned ? "destructive" : "default"}
                        className={`font-heading tracking-wider text-xs ${
                          !user.banned ? "bg-pif-green/20 text-pif-green border-pif-green/30" : ""
                        }`}
                      >
                        {user.banned ? "Banned" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.last_drill_date || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => toggleBan(user)}>
                        {user.banned ? "Unban" : "Ban"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
