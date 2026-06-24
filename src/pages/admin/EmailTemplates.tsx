import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAdminSettingsOptions,
  useUpdateEmailTemplates,
} from "@/queries/useAdminSettings";
import type { EmailTemplateAPI } from "@/types/admin/settings";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Mail } from "lucide-react";

const PLACEHOLDERS: Record<string, string[]> = {
  order_confirmation: ["{{buyer_name}}", "{{order_id}}", "{{order_total}}"],
  shipping_notification: ["{{buyer_name}}", "{{order_id}}", "{{item_title}}"],
  password_reset: ["{{reset_link}}"],
};

const EmailTemplates = () => {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery(getAdminSettingsOptions());
  const updateTemplates = useUpdateEmailTemplates();

  const [localTemplates, setLocalTemplates] = useState<EmailTemplateAPI[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Sync from server once on first load
  if (!initialized && settings?.emailTemplates?.length) {
    setLocalTemplates(settings.emailTemplates);
    setInitialized(true);
  }

  const templates = localTemplates;

  const updateField = (
    id: string,
    field: keyof EmailTemplateAPI,
    value: string,
  ) => {
    setLocalTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  };

  const save = (tpl: EmailTemplateAPI) => {
    setSavingId(tpl.id);
    const nextTemplates = templates.map((t) => (t.id === tpl.id ? tpl : t));
    updateTemplates.mutate(nextTemplates, {
      onSuccess: () => {
        toast({ title: "Template saved", description: `${tpl.key} updated.` });
        setSavingId(null);
      },
      onError: (e: any) => {
        toast({
          title: "Save failed",
          description: e.message,
          variant: "destructive",
        });
        setSavingId(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">
            Email Templates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage subject lines and body content for automated email
            notifications.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Mail className="h-12 w-12" />
          <p className="text-sm">No email templates configured yet.</p>
          <p className="text-xs">
            Ask the backend team to seed initial templates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Email Templates
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage subject lines and body content for automated email
          notifications.
        </p>
      </div>

      <div className="space-y-6">
        {templates.map((tpl) => {
          const placeholders = PLACEHOLDERS[tpl.key] ?? [];
          const isSaving = savingId === tpl.id;
          return (
            <Card key={tpl.id}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{tpl.key}</CardTitle>
                    <CardDescription className="mt-1 font-mono text-xs">
                      {tpl.id}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={tpl.subject}
                    onChange={(e) =>
                      updateField(tpl.id, "subject", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body</Label>
                  <Textarea
                    value={tpl.body}
                    onChange={(e) =>
                      updateField(tpl.id, "body", e.target.value)
                    }
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                {placeholders.length > 0 && (
                  <div className="rounded-md border border-border bg-muted/40 p-3">
                    <p className="mb-2 text-xs font-medium text-foreground">
                      Available placeholders:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {placeholders.map((p) => (
                        <code
                          key={p}
                          className="rounded bg-background px-2 py-0.5 text-xs text-primary"
                        >
                          {p}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button onClick={() => save(tpl)} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default EmailTemplates;
