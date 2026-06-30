import { useQuery } from '@tanstack/react-query';

import {
  AlertTriangle,
  Eye,
  Loader2,
  Lock,
  Plus,
  ShieldAlert,
  Tag,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getFlagKeywordsOptions,
  useUpdateFlagKeywordsMutation,
} from '@/queries/flagKeyword.query';

// ─── Constants ────────────────────────────────────────────────────────────────

const keywordSchema = z
  .string()
  .trim()
  .min(2, 'Min 2 characters')
  .max(60, 'Max 60 characters');

// System-level rules are hardcoded — not stored in backend
const SYSTEM_RULES: Array<{
  action: 'auto_delete' | 'review';
  keyword: string;
  reason: string;
}> = [
  {
    action: 'auto_delete',
    keyword: 'Phone numbers',
    reason: 'Possible phone number detected',
  },
  {
    action: 'auto_delete',
    keyword: 'Email addresses',
    reason: 'Possible email address detected',
  },
  {
    action: 'review',
    keyword: 'Social handles (@username)',
    reason: 'Possible social media handle detected',
  },
  {
    action: 'review',
    keyword: 'Platform mentions (instagram, whatsapp, telegram…)',
    reason: 'Social media platform mention detected',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

function FlagKeywords() {
  const [draft, setDraft] = useState('');

  const { data: keywords = [], isLoading } = useQuery(getFlagKeywordsOptions());
  const updateKeywords = useUpdateFlagKeywordsMutation();

  const handleAdd = () => {
    const parsed = keywordSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    const lower = parsed.data.toLowerCase();

    if (keywords.includes(lower)) {
      toast.error('That keyword already exists');
      return;
    }

    updateKeywords.mutate([lower, ...keywords], {
      onError: (error: any) => toast.error(error.message ?? 'Failed to add keyword'),
      onSuccess: () => {
        toast.success('Keyword added');
        setDraft('');
      },
    });
  };

  const handleDelete = (keyword: string) => {
    updateKeywords.mutate(
      keywords.filter(k => k !== keyword),
      {
        onError: (error: any) =>
          toast.error(error.message ?? 'Failed to remove keyword'),
        onSuccess: () => toast.success('Keyword removed'),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Flag Keywords
        </h1>
        <p className="mt-1 text-muted-foreground">
          Add custom words or phrases. Any message containing them will be
          automatically flagged for review.
        </p>
      </div>

      {/* Add new keyword */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="keyword">Keyword or phrase</Label>
              <Input
                id="keyword"
                onChange={event => setDraft(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && handleAdd()}
                value={draft}
                maxLength={60}
                placeholder="e.g. cashapp"
              />
            </div>
            <Button
              onClick={handleAdd}
              disabled={updateKeywords.isPending || !draft.trim()}
              className="gap-2"
            >
              {updateKeywords.isPending
                ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )
                : (
                    <Plus className="h-4 w-4" />
                  )}
              Add
            </Button>
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Matching is case-insensitive and applies to any message containing
            the keyword as a substring. Flagged messages appear in Message
            Moderation for admin review.
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
            <Lock className="h-3 w-3" />
            {' '}
            System
          </Badge>
        </div>
        {SYSTEM_RULES.map(r => (
          <Card key={r.keyword} className="border-dashed bg-muted/20">
            <CardContent className="
              flex flex-col gap-3 p-4
              sm:flex-row sm:items-center
            "
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {r.keyword}
                  </Badge>
                  {r.action === 'auto_delete'
                    ? (
                        <Badge variant="destructive" className="gap-1 text-[10px]">
                          <ShieldAlert className="h-3 w-3" />
                          {' '}
                          Auto-delete
                        </Badge>
                      )
                    : (
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <Eye className="h-3 w-3" />
                          {' '}
                          Review required
                        </Badge>
                      )}
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {r.reason}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                Always on
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom keywords list */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Custom keywords
        </h2>
        {isLoading
          ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )
          : (keywords.length === 0
              ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                    <Tag className="h-10 w-10" />
                    <p className="text-sm">No custom keywords yet</p>
                  </div>
                )
              : (
                  <div className="space-y-2">
                    {keywords.map(k => (
                      <Card key={k}>
                        <CardContent className="flex items-center gap-3 p-4">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {k}
                          </Badge>
                          <Badge variant="outline" className="gap-1 text-[10px]">
                            <Eye className="h-3 w-3" />
                            {' '}
                            Review required
                          </Badge>
                          <div className="flex-1" />
                          <Button
                            onClick={() => handleDelete(k)}
                            disabled={updateKeywords.isPending}
                            size="icon"
                            variant="ghost"
                            className="
                              text-destructive
                              hover:text-destructive
                            "
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ))}
      </div>
    </div>
  );
}

export default FlagKeywords;
