import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NEXT_PUBLIC_USE_MOCK_DATA } from "@/lib/mockConfig";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Mail } from "lucide-react";

interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  body: string;
  enabled: boolean;
}

const PLACEHOLDERS: Record<string, string[]> = {
  order_confirmation: ["{{buyer_name}}", "{{order_id}}", "{{order_total}}"],
  shipping_notification: ["{{buyer_name}}", "{{order_id}}", "{{item_title}}"],
};

// ── Mock data (used when NEXT_PUBLIC_USE_MOCK_DATA = true) ──
// `let` so saved edits persist across re-loads within the mock session.
let MOCK_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "mock-template-order-confirmation",
    key: "order_confirmation",
    name: "Order Confirmation",
    subject: "Your order {{order_id}} is confirmed!",
    body:
      "Hi {{buyer_name}},\n\nThanks for your order! We've received order {{order_id}} for a total of {{order_total}}. We'll notify you again once it ships.\n\n— The Team",
    enabled: true,
  },
  {
    id: "mock-template-shipping-notification",
    key: "shipping_notification",
    name: "Shipping Notification",
    subject: "Your order {{order_id}} has shipped",
    body:
      "Hi {{buyer_name}},\n\nGood news — {{item_title}} from order {{order_id}} is on its way!\n\n— The Team",
    enabled: true,
  },
  {
    id: "mock-template-password-reset",
    key: "password_reset",
    name: "Password Reset",
    subject: "Reset your password",
    body:
      "Hi there,\n\nWe received a request to reset your password. Click the link below to choose a new one.\n\nIf you didn't request this, you can ignore this email.",
    enabled: false,
  },
];

const EmailTemplates = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    if (NEXT_PUBLIC_USE_MOCK_DATA) {
      setTemplates(MOCK_EMAIL_TEMPLATES);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("email_templates" as any)
      .select("*")
      .order("name");
    if (error) {
      toast({ title: "Failed to load templates", description: error.message, variant: "destructive" });
    } else {
      setTemplates((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateField = (id: string, field: keyof EmailTemplate, value: any) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const save = async (tpl: EmailTemplate) => {
    setSavingId(tpl.id);
    if (NEXT_PUBLIC_USE_MOCK_DATA) {
      MOCK_EMAIL_TEMPLATES = MOCK_EMAIL_TEMPLATES.map((t) => (t.id === tpl.id ? { ...tpl } : t));
      setSavingId(null);
      toast({ title: "Template saved", description: `${tpl.name} updated.` });
      return;
    }
    const { error } = await supabase
      .from("email_templates" as any)
      .update({ subject: tpl.subject, body: tpl.body, enabled: tpl.enabled })
      .eq("id", tpl.id);
    setSavingId(null);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template saved", description: `${tpl.name} updated.` });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-foreground">Email Templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage subject lines and body content for automated email notifications.
        </p>
      </div>

      <div className="space-y-6">
        {templates.map((tpl) => {
          const placeholders = PLACEHOLDERS[tpl.key] || [];
          return (
            <Card key={tpl.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2 text-primary">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{tpl.name}</CardTitle>
                      <CardDescription className="mt-1 font-mono text-xs">{tpl.key}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`enabled-${tpl.id}`} className="text-sm">
                      Enabled
                    </Label>
                    <Switch
                      id={`enabled-${tpl.id}`}
                      checked={tpl.enabled}
                      onCheckedChange={(v) => updateField(tpl.id, "enabled", v)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`subject-${tpl.id}`}>Subject</Label>
                  <Input
                    id={`subject-${tpl.id}`}
                    value={tpl.subject}
                    onChange={(e) => updateField(tpl.id, "subject", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`body-${tpl.id}`}>Body</Label>
                  <Textarea
                    id={`body-${tpl.id}`}
                    value={tpl.body}
                    onChange={(e) => updateField(tpl.id, "body", e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                {placeholders.length > 0 && (
                  <div className="rounded-md border border-border bg-muted/40 p-3">
                    <p className="mb-2 text-xs font-medium text-foreground">Available placeholders:</p>
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
                  <Button onClick={() => save(tpl)} disabled={savingId === tpl.id}>
                    {savingId === tpl.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
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