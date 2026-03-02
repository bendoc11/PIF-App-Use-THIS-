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
import { Loader2, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PostRow {
  id: string;
  title: string;
  body: string;
  category: string;
  created_at: string;
  hidden: boolean;
  user_id: string;
}

type PostFilter = "all" | "hidden";

export default function AdminModeration() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PostFilter>("all");

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("community_posts")
      .select("id, title, body, category, created_at, hidden, user_id")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading posts", description: error.message, variant: "destructive" });
    }
    setPosts((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const toggleHidden = async (post: PostRow) => {
    const newHidden = !post.hidden;
    const { error } = await supabase
      .from("community_posts")
      .update({ hidden: newHidden } as any)
      .eq("id", post.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, hidden: newHidden } : p)));
    toast({ title: newHidden ? "Post hidden" : "Post restored" });
  };

  const deletePost = async (id: string) => {
    if (!confirm("Permanently delete this post?")) return;
    const { error } = await supabase.from("community_posts").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Post deleted" });
  };

  const filtered = filter === "hidden" ? posts.filter((p) => p.hidden) : posts;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-heading text-foreground">Community Moderation</h1>

        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className="font-heading tracking-wider text-xs"
          >
            All Posts
          </Button>
          <Button
            variant={filter === "hidden" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("hidden")}
            className="font-heading tracking-wider text-xs"
          >
            Hidden
          </Button>
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
                  <TableHead className="font-heading tracking-wider">Post</TableHead>
                  <TableHead className="font-heading tracking-wider">Category</TableHead>
                  <TableHead className="font-heading tracking-wider">Date</TableHead>
                  <TableHead className="font-heading tracking-wider">Status</TableHead>
                  <TableHead className="font-heading tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((post) => (
                  <TableRow key={post.id} className="border-border">
                    <TableCell className="max-w-xs">
                      <p className="font-medium text-foreground truncate">{post.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{post.body.slice(0, 80)}...</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-heading tracking-wider text-xs">
                        {post.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={post.hidden ? "destructive" : "default"}
                        className={`font-heading tracking-wider text-xs ${
                          !post.hidden ? "bg-pif-green/20 text-pif-green border-pif-green/30" : ""
                        }`}
                      >
                        {post.hidden ? "Hidden" : "Visible"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleHidden(post)}>
                          {post.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deletePost(post.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No posts found
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
