import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAccessControl } from '@/hooks/useAccessControl';
import { showErrorToast } from '@/lib/errorToast';
import {
  getAdminFlaggedBuyerRulesOptions,
  useUpdateAdminFlaggedBuyerRulesMutation,
} from '@/queries/adminFlaggedBuyers.query';

const flaggedBuyerRuleSchema = z.object({
  threshold: z.number().int('Threshold must be a positive whole number.').min(1, 'Threshold must be a positive whole number.'),
  windowDays: z.number().int('Lookback window must be a positive whole number.').min(1, 'Lookback window must be a positive whole number.'),
});

type FlaggedBuyerRuleForm = z.infer<typeof flaggedBuyerRuleSchema>;

export default function FlaggedBuyers() {
  const { can } = useAccessControl();
  const canReadRules = can('COMPLAINTS_READ');
  const canEditRules = can(['COMPLAINTS_READ', 'COMPLAINTS_UPDATE']);
  const rules = useQuery({ ...getAdminFlaggedBuyerRulesOptions(), enabled: canReadRules });
  const updateRules = useUpdateAdminFlaggedBuyerRulesMutation();
  const form = useForm<FlaggedBuyerRuleForm>({
    defaultValues: { threshold: 3, windowDays: 90 },
    resolver: zodResolver(flaggedBuyerRuleSchema),
  });
  const { reset } = form;

  useEffect(() => {
    if (rules.data?.data) {
      reset({ threshold: rules.data.data.threshold, windowDays: rules.data.data.windowDays });
    }
  }, [reset, rules.data]);

  async function saveRule(values: FlaggedBuyerRuleForm) {
    try {
      await updateRules.mutateAsync(values);
      toast.success('Flagged buyer rule saved');
    }
    catch (error) {
      showErrorToast(error, 'Failed to save flagged buyer rule');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Flagged Buyers</h1>
        <p className="text-sm text-muted-foreground">
          Review buyers with repeated refund or return complaints and configure the flagging rule.
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Refund activity rule
          </CardTitle>
          <CardDescription>
            Buyers are flagged when they meet the complaint threshold within the lookback window.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canReadRules
            ? rules.isLoading
              ? <div className="flex justify-center p-8"><Loader2 aria-label="Loading rule" className="h-5 w-5 animate-spin" /></div>
              : rules.isError
                ? <p role="alert" className="text-sm text-destructive">Unable to load the flagged buyer rule.</p>
                : (
                    <form onSubmit={form.handleSubmit(saveRule)} className="space-y-5">
                      <div className="
                        grid gap-4
                        sm:grid-cols-2
                      "
                      >
                        <div className="space-y-2">
                          <Label htmlFor="threshold">Complaint threshold</Label>
                          <Input
                            id="threshold"
                            aria-invalid={!!form.formState.errors.threshold}
                            disabled={!canEditRules || updateRules.isPending}
                            inputMode="numeric"
                            type="text"
                            {...form.register('threshold', { setValueAs: Number })}
                          />
                          {form.formState.errors.threshold && <p className="text-sm text-destructive">{form.formState.errors.threshold.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="windowDays">Lookback window (days)</Label>
                          <Input
                            id="windowDays"
                            aria-invalid={!!form.formState.errors.windowDays}
                            disabled={!canEditRules || updateRules.isPending}
                            inputMode="numeric"
                            type="text"
                            {...form.register('windowDays', { setValueAs: Number })}
                          />
                          {form.formState.errors.windowDays && <p className="text-sm text-destructive">{form.formState.errors.windowDays.message}</p>}
                        </div>
                      </div>
                      {canEditRules && (
                        <Button disabled={updateRules.isPending || rules.isLoading} type="submit">
                          {updateRules.isPending && <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />}
                          {updateRules.isPending ? 'Saving…' : 'Save rule'}
                        </Button>
                      )}
                    </form>
                  )
            : <p className="text-sm text-muted-foreground">You do not have permission to view flagged buyer rules.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
