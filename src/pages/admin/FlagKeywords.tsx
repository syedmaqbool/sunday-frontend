import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, Tag, AlertTriangle, ShieldAlert, Eye } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

type Action = "review" | "auto_delete";

interface FlagKeyword {
  id: string;
  keyword: string;
  reason: string;
  active: boolean;
  action: Action;
  created_at: string;
}

const keywordSchema = z.object({
  keyword: z.string().trim().min(2, "Min 2 characters").max(60, "Max 60 characters"),
  reason: z.string().trim().min(2, "Min 2 characters").max(120, "Max 120 characters"),
});

const FlagKeywords = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [reason, setReason] = useState("");
  const [action, setAction] = useState<Action>("review");

  const { data: keywords = [], isLoading } = useQuery({
    queryKey: ["admin-flag-keywords"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flag_keywords")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FlagKeyword[];
    },
  });

  const addKeyword = useMutation({
    mutationFn: async () => {
      const parsed = keywordSchema.safeParse({ keyword, reason });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0].message);
      }
      const { error } = await supabase.from("flag_keywords").insert({
        keyword: parsed.data.keyword.toLowerCase(),
        reason: parsed.data.reason,
        action,
        created_by: user?.id,
      });
      if (error) {
        if (error.code === "23505") throw new Error("That keyword already exists");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Keyword added");
      setKeyword("");
      setReason("");
      setAction("review");
      queryClient.invalidateQueries({ queryKey: ["admin-flag-keywords"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateAction = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: Action }) => {
      const { error } = await supabase.from("flag_keywords").update({ action }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Behavior updated");
      queryClient.invalidateQueries({ queryKey: ["admin-flag-keywords"] });
    },
    onError: () => toast.error("Failed to update behavior"),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("flag_keywords").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-flag-keywords"] }),
    onError: () => toast.error("Failed to update keyword"),
  });

  const deleteKeyword = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("flag_keywords").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Keyword removed");
      queryClient.invalidateQueries({ queryKey: ["admin-flag-keywords"] });
    },
    onError: () => toast.error("Failed to remove keyword"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Flag Keywords</h1>
        <p className="mt-1 text-muted-foreground">
          Add custom words or phrases. Any message containing them will be automatically flagged for review.
        </p>
      </div>

      {/* Add new keyword */}
      <Card>
        <CardContent className="p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="keyword">Keyword or phrase</Label>
              <Input
                id="keyword"
                placeholder="e.g. cashapp"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                maxLength={60}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Flag reason (shown to admins)</Label>
              <Input
                id="reason"
                placeholder="e.g. Payment platform mention"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={120}
              />
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="action">When matched</Label>
              <Select value={action} onValueChange={(v) => setAction(v as Action)}>
                <SelectTrigger id="action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="review">
                    <span className="flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5" /> Review required — admin confirms before action
                    </span>
                  </SelectItem>
                  <SelectItem value="auto_delete">
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="h-3.5 w-3.5" /> Auto-delete — remove message immediately
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => addKeyword.mutate()}
              disabled={addKeyword.isPending || !keyword.trim() || !reason.trim()}
              className="gap-2"
            >
              {addKeyword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Keyword
            </Button>
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Matching is case-insensitive and applies to any message containing the keyword as a substring.
            Auto-deleted messages still appear in admin messages for the original conversation.
          </p>
        </CardContent>
      </Card>

      {/* Keywords list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : keywords.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Tag className="h-10 w-10" />
          <p className="text-sm">No custom keywords yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keywords.map((k) => (
            <Card key={k.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {k.keyword}
                    </Badge>
                    {!k.active && <Badge variant="outline" className="text-[10px]">Disabled</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground truncate">{k.reason}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={k.active}
                      onCheckedChange={(checked) => toggleActive.mutate({ id: k.id, active: checked })}
                    />
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteKeyword.mutate(k.id)}
                    disabled={deleteKeyword.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlagKeywords;
