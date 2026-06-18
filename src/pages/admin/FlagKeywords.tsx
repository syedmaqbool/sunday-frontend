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
import { Plus, Trash2, Loader2, Tag, AlertTriangle, ShieldAlert, Eye, Lock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { NEXT_PUBLIC_USE_MOCK_DATA } from "@/lib/mockConfig";

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

const SYSTEM_RULES: Array<{ keyword: string; reason: string; action: Action }> = [
  { keyword: "Phone numbers", reason: "Possible phone number detected", action: "auto_delete" },
  { keyword: "Email addresses", reason: "Possible email address detected", action: "auto_delete" },
  { keyword: "Social handles (@username)", reason: "Possible social media handle detected", action: "review" },
  {
    keyword: "Platform mentions (instagram, whatsapp, telegram…)",
    reason: "Social media platform mention detected",
    action: "review",
  },
];

// ─── Mock Data ────────────────────────────────────────────────────────────────

let mockKeywordsStore: FlagKeyword[] = [
  {
    id: "kw-1",
    keyword: "cashapp",
    reason: "Payment platform mention",
    active: true,
    action: "auto_delete",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "kw-2",
    keyword: "meet outside",
    reason: "Possible attempt to arrange off-platform transaction",
    active: true,
    action: "review",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "kw-3",
    keyword: "easypaisa",
    reason: "Payment platform mention",
    active: false,
    action: "review",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const FlagKeywords = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [reason, setReason] = useState("");
  const [action, setAction] = useState<Action>("review");

  const { data: keywords = [], isLoading } = useQuery({
    queryKey: ["admin-flag-keywords"],
    queryFn: async () => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) return mockKeywordsStore;
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

      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        const lower = parsed.data.keyword.toLowerCase();
        if (mockKeywordsStore.some((k) => k.keyword === lower)) {
          throw new Error("That keyword already exists");
        }
        mockKeywordsStore = [
          {
            id: `kw-${Date.now()}`,
            keyword: lower,
            reason: parsed.data.reason,
            action,
            active: true,
            created_at: new Date().toISOString(),
          },
          ...mockKeywordsStore,
        ];
        return;
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
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        mockKeywordsStore = mockKeywordsStore.map((k) => (k.id === id ? { ...k, action } : k));
        return;
      }
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
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        mockKeywordsStore = mockKeywordsStore.map((k) => (k.id === id ? { ...k, active } : k));
        return;
      }
      const { error } = await supabase.from("flag_keywords").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-flag-keywords"] }),
    onError: () => toast.error("Failed to update keyword"),
  });

  const deleteKeyword = useMutation({
    mutationFn: async (id: string) => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        mockKeywordsStore = mockKeywordsStore.filter((k) => k.id !== id);
        return;
      }
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

      {/* Built-in detection rules */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Built-in detection
          </h2>
          <Badge variant="outline" className="gap-1 text-[10px]">
            <Lock className="h-3 w-3" /> System
          </Badge>
        </div>
        {SYSTEM_RULES.map((r) => (
          <Card key={r.keyword} className="border-dashed bg-muted/20">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{r.keyword}</Badge>
                  {r.action === "auto_delete" ? (
                    <Badge variant="destructive" className="gap-1 text-[10px]">
                      <ShieldAlert className="h-3 w-3" /> Auto-delete
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-[10px]">
                      <Eye className="h-3 w-3" /> Review required
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground truncate">{r.reason}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">Always on</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom keywords list */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Custom keywords
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : keywords.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
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
                    {k.action === "auto_delete" ? (
                      <Badge variant="destructive" className="gap-1 text-[10px]">
                        <ShieldAlert className="h-3 w-3" /> Auto-delete
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Eye className="h-3 w-3" /> Review required
                      </Badge>
                    )}
                    {!k.active && <Badge variant="outline" className="text-[10px]">Disabled</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground truncate">{k.reason}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Select
                    value={k.action}
                    onValueChange={(v) => updateAction.mutate({ id: k.id, action: v as Action })}
                  >
                    <SelectTrigger className="h-8 w-[160px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="review">Review required</SelectItem>
                      <SelectItem value="auto_delete">Auto-delete</SelectItem>
                    </SelectContent>
                  </Select>
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
    </div>
  );
};

export default FlagKeywords;