import type { EmailTemplateAPI } from '@/types/adminSettings.type';
import { zodResolver } from '@hookform/resolvers/zod';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Mail, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getErrorToastOptions } from '@/lib/errorToast';
import {
  getAdminSettingsOptions,
  useUpdateEmailTemplatesMutation,
} from '@/queries/adminSettings.query';

const PLACEHOLDERS: Record<string, string[]> = {
  order_confirmation: ['{{buyer_name}}', '{{order_id}}', '{{order_total}}'],
  password_reset: ['{{reset_link}}'],
  shipping_notification: ['{{buyer_name}}', '{{order_id}}', '{{item_title}}'],
};

const emailTemplatesFormSchema = z.object({
  templates: z.array(z.object({
    key: z.string(),
    id: z.string(),
    body: z.string(),
    subject: z.string(),
  })),
});

type EmailTemplatesFormValues = z.infer<typeof emailTemplatesFormSchema>;

function EmailTemplates() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery(getAdminSettingsOptions());
  const updateTemplates = useUpdateEmailTemplatesMutation();

  const [initialized, setInitialized] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const form = useForm<EmailTemplatesFormValues>({
    defaultValues: { templates: [] },
    resolver: zodResolver(emailTemplatesFormSchema),
  });
  const { reset } = form;

  // Sync from server once on first load
  useEffect(() => {
    if (!(!initialized && settings?.emailTemplates?.length)) {
      return;
    }

    reset({ templates: settings.emailTemplates });
    setInitialized(true);
  }, [initialized, reset, settings?.emailTemplates]);

  const templates = form.watch('templates');

  const save = (tpl: EmailTemplateAPI, allTemplates: EmailTemplateAPI[]) => {
    setSavingId(tpl.id);
    updateTemplates.mutate(allTemplates, {
      onError: (error: any) => {
        toast(getErrorToastOptions(error));
        setSavingId(null);
      },
      onSuccess: () => {
        toast({ description: `${tpl.key} updated.`, title: 'Template saved' });
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
        {templates.map((tpl, index) => {
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
                <form
                  onSubmit={form.handleSubmit((values) => {
                    const template = values.templates[index];
                    if (template)
                      save(template as EmailTemplateAPI, values.templates as EmailTemplateAPI[]);
                  })}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Controller name={`templates.${index}.subject`} control={form.control} render={({ field }) => <Input {...field} />} />
                  </div>
                  <div className="space-y-2">
                    <Label>Body</Label>
                    <Controller
                      name={`templates.${index}.body`}
                      control={form.control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          rows={10}
                          className="font-mono text-sm"
                        />
                      )}
                    />
                  </div>
                  {placeholders.length > 0 && (
                    <div className="rounded-md border border-border bg-muted/40 p-3">
                      <p className="mb-2 text-xs font-medium text-foreground">
                        Available placeholders:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {placeholders.map(p => (
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
                    <Button disabled={isSaving} type="submit">
                      {isSaving
                        ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )
                        : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default EmailTemplates;
