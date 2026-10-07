import type { AdminFlaggedBuyer, AdminFlaggedBuyerComplaintHistory } from '@/types/adminFlaggedBuyer.type';
import { zodResolver } from '@hookform/resolvers/zod';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAccessControl } from '@/hooks/useAccessControl';
import { showErrorToast } from '@/lib/errorToast';
import {
  getAdminFlaggedBuyerComplaintHistoryOptions,
  getAdminFlaggedBuyerRulesOptions,
  getAdminFlaggedBuyersOptions,
  useUpdateAdminFlaggedBuyerRulesMutation,
  useWarnAdminFlaggedBuyerMutation,
} from '@/queries/adminFlaggedBuyers.query';

const FLAGGED_BUYERS_PAGE_SIZE = 20;

const THRESHOLD_ERROR = 'Threshold must be a positive whole number.';
const WINDOW_DAYS_ERROR = 'Lookback window must be a positive whole number.';

const flaggedBuyerRuleSchema = z.object({
  threshold: z.number({ invalid_type_error: THRESHOLD_ERROR }).int(THRESHOLD_ERROR).min(1, THRESHOLD_ERROR),
  windowDays: z.number({ invalid_type_error: WINDOW_DAYS_ERROR }).int(WINDOW_DAYS_ERROR).min(1, WINDOW_DAYS_ERROR),
});

const HISTORY_STATUS_LABEL: Record<AdminFlaggedBuyerComplaintHistory['status'], string> = {
  REFUNDED: 'Completed (Refunded)',
  RETURN_RECEIVED: 'Return Received',
};

type FlaggedBuyerRuleForm = z.infer<typeof flaggedBuyerRuleSchema>;
const flaggedBuyerWarningSchema = z.object({ message: z.string() });
type FlaggedBuyerWarningForm = z.infer<typeof flaggedBuyerWarningSchema>;

export default function FlaggedBuyers() {
  const { can } = useAccessControl();
  const [page, setPage] = useState(1);
  const [historyBuyer, setHistoryBuyer] = useState<AdminFlaggedBuyer | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [warningBuyer, setWarningBuyer] = useState<AdminFlaggedBuyer | null>(null);
  const canReadRules = can('COMPLAINTS_READ');
  const canEditRules = can(['COMPLAINTS_READ', 'COMPLAINTS_UPDATE']);
  const rules = useQuery({ ...getAdminFlaggedBuyerRulesOptions(), enabled: canReadRules });
  const buyers = useQuery({
    ...getAdminFlaggedBuyersOptions({ page, size: FLAGGED_BUYERS_PAGE_SIZE }),
    enabled: canReadRules,
    placeholderData: keepPreviousData,
  });
  const history = useQuery({
    ...getAdminFlaggedBuyerComplaintHistoryOptions(historyBuyer?.buyerId ?? '', { page: historyPage, size: FLAGGED_BUYERS_PAGE_SIZE }),
    enabled: canReadRules && historyBuyer !== null,
    // Keep the previous page only while paging the same buyer; never show another buyer's history.
    placeholderData: (previousData, previousQuery) => previousQuery?.queryKey[2] === historyBuyer?.buyerId ? previousData : undefined,
  });
  useEffect(() => {
    const pagination = buyers.data?.pagination;
    if (pagination && pagination.total > 0 && pagination.currentPage > pagination.lastPage) {
      setPage(pagination.lastPage);
    }
  }, [buyers.data]);
  useEffect(() => {
    const pagination = history.data?.pagination;
    if (pagination && pagination.total > 0 && pagination.currentPage > pagination.lastPage) {
      setHistoryPage(pagination.lastPage);
    }
  }, [history.data]);
  const updateRules = useUpdateAdminFlaggedBuyerRulesMutation();
  const warnBuyer = useWarnAdminFlaggedBuyerMutation();
  const form = useForm<FlaggedBuyerRuleForm>({
    defaultValues: { threshold: 3, windowDays: 90 },
    resolver: zodResolver(flaggedBuyerRuleSchema),
  });
  const { reset } = form;
  const warningForm = useForm<FlaggedBuyerWarningForm>({
    defaultValues: { message: '' },
    resolver: zodResolver(flaggedBuyerWarningSchema),
  });

  useEffect(() => {
    if (rules.data?.data) {
      reset({ threshold: rules.data.data.threshold, windowDays: rules.data.data.windowDays });
    }
  }, [reset, rules.data]);

  async function saveRule(values: FlaggedBuyerRuleForm) {
    try {
      await updateRules.mutateAsync(values);
      setPage(1);
      toast.success('Flagged buyer rule saved');
    }
    catch (error) {
      showErrorToast(error, 'Failed to save flagged buyer rule');
    }
  }

  function resetWarningForm() {
    warningForm.reset({ message: '' });
  }

  async function sendWarning(values: FlaggedBuyerWarningForm) {
    if (warningBuyer === null)
      return;

    const message = values.message.trim();
    try {
      await warnBuyer.mutateAsync({
        buyerId: warningBuyer.buyerId,
        body: message ? { message } : {},
      });
      toast.success('Buyer warning sent');
      setWarningBuyer(null);
      resetWarningForm();
    }
    catch (error) {
      showErrorToast(error, 'Failed to send buyer warning');
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

      {canReadRules
        ? (
            <section aria-label="Flagged buyer results" className="space-y-4">
              <div className="
                grid gap-3
                sm:grid-cols-2
              "
              >
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs uppercase text-muted-foreground">Qualifying buyers</p>
                    <p className="font-heading text-2xl font-semibold">
                      {buyers.data?.aggregates?.qualifyingBuyerCount ?? '—'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs uppercase text-muted-foreground">Counted complaint rows</p>
                    <p className="font-heading text-2xl font-semibold">
                      {buyers.data?.aggregates?.countedComplaintRowCount ?? '—'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Buyers meeting the rule</CardTitle>
                  <CardDescription>
                    Buyers and complaint totals are shown in the order returned by the API.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {buyers.isLoading
                    ? <div className="flex items-center justify-center p-12"><Loader2 aria-label="Loading flagged buyers" className="h-5 w-5 animate-spin" /></div>
                    : buyers.isError
                      ? <p role="alert" className="p-8 text-center text-sm text-destructive">Unable to load flagged buyers.</p>
                      : buyers.data.data.length === 0
                        ? <p className="p-8 text-center text-sm text-muted-foreground">No buyers meet the current rule.</p>
                        : (
                            <>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Buyer</TableHead>
                                    <TableHead>Profile</TableHead>
                                    <TableHead>Qualifying complaints</TableHead>
                                    <TableHead>Latest qualifying complaint</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {buyers.data.data.map(buyer => (
                                    <TableRow key={buyer.buyerId}>
                                      <TableCell className="font-medium">{buyer.displayName}</TableCell>
                                      <TableCell className="text-sm">
                                        <Link
                                          to={`/seller/${buyer.buyerId}`}
                                          className="
                                            text-primary
                                            hover:underline
                                          "
                                        >
                                          Profile
                                        </Link>
                                      </TableCell>
                                      <TableCell>{buyer.qualifyingComplaintCount}</TableCell>
                                      <TableCell>{format(new Date(buyer.latestQualifyingComplaintCreatedAt), 'dd MMM yyyy')}</TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                          {canEditRules && (
                                            <Button
                                              onClick={() => {
                                                resetWarningForm();
                                                setWarningBuyer(buyer);
                                              }}
                                              size="sm"
                                              type="button"
                                              variant="outline"
                                            >
                                              Warn
                                            </Button>
                                          )}
                                          <Button
                                            onClick={() => {
                                              setHistoryPage(1);
                                              setHistoryBuyer(buyer);
                                            }}
                                            size="sm"
                                            type="button"
                                            variant="outline"
                                          >
                                            History
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              {buyers.data.pagination.total > 0 && (
                                <div className="flex items-center justify-between gap-4 border-t p-4 text-sm">
                                  <p className="text-muted-foreground">
                                    Page
                                    {' '}
                                    {buyers.data.pagination.currentPage}
                                    {' '}
                                    of
                                    {' '}
                                    {buyers.data.pagination.lastPage}
                                    {' '}
                                    ·
                                    {' '}
                                    {buyers.data.pagination.total}
                                    {' '}
                                    buyers
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => setPage(buyers.data.pagination.prevPage ?? 1)}
                                      aria-label="Previous page"
                                      disabled={buyers.data.pagination.prevPage === null || buyers.isFetching}
                                      type="button"
                                      variant="outline"
                                    >
                                      Previous
                                    </Button>
                                    <Button
                                      onClick={() => setPage(buyers.data.pagination.nextPage ?? page)}
                                      aria-label="Next page"
                                      disabled={buyers.data.pagination.nextPage === null || buyers.isFetching}
                                      type="button"
                                      variant="outline"
                                    >
                                      Next
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                </CardContent>
              </Card>
            </section>
          )
        : null}

      <Dialog onOpenChange={open => !open && setHistoryBuyer(null)} open={historyBuyer !== null}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Complaint history</DialogTitle>
            <DialogDescription>
              Qualifying complaints for
              {' '}
              {historyBuyer?.displayName}
              .
            </DialogDescription>
          </DialogHeader>

          {historyBuyer === null
            ? null
            : history.isLoading
              ? <div className="flex items-center justify-center p-12"><Loader2 aria-label="Loading complaint history" className="h-5 w-5 animate-spin" /></div>
              : history.isError
                ? <p role="alert" className="p-8 text-center text-sm text-destructive">Unable to load complaint history.</p>
                : history.data.data.length === 0
                  ? <p className="p-8 text-center text-sm text-muted-foreground">No qualifying complaint history.</p>
                  : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Reason</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {history.data.data.map(complaint => (
                              <TableRow key={complaint.id}>
                                <TableCell className="whitespace-nowrap">{format(new Date(complaint.createdAt), 'dd MMM yyyy')}</TableCell>
                                <TableCell>{HISTORY_STATUS_LABEL[complaint.status]}</TableCell>
                                <TableCell>{complaint.reason}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {history.data.pagination.total > 0 && (
                          <div className="flex items-center justify-between gap-4 border-t pt-4 text-sm">
                            <p className="text-muted-foreground">
                              Page
                              {' '}
                              {history.data.pagination.currentPage}
                              {' '}
                              of
                              {' '}
                              {history.data.pagination.lastPage}
                              {' · '}
                              {history.data.pagination.total}
                              {' '}
                              complaints
                            </p>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => setHistoryPage(history.data.pagination.prevPage ?? 1)}
                                aria-label="Previous history page"
                                disabled={history.data.pagination.prevPage === null || history.isFetching}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                Previous
                              </Button>
                              <Button
                                onClick={() => setHistoryPage(history.data.pagination.nextPage ?? historyPage)}
                                aria-label="Next history page"
                                disabled={history.data.pagination.nextPage === null || history.isFetching}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (open || warnBuyer.isPending) {
            return;
          }

          setWarningBuyer(null);
          resetWarningForm();
        }}
        open={warningBuyer !== null}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Warn buyer</DialogTitle>
            <DialogDescription>
              Send a warning to
              {' '}
              {warningBuyer?.displayName}
              {' '}
              about their refund activity. Leave the message blank to use the default warning.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={warningForm.handleSubmit(sendWarning)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="warning-message">Custom message (optional)</Label>
              <Textarea
                id="warning-message"
                disabled={warnBuyer.isPending}
                {...warningForm.register('message')}
              />
            </div>
            <DialogFooter>
              <Button disabled={warnBuyer.isPending} type="submit">
                {warnBuyer.isPending && <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />}
                {warnBuyer.isPending ? 'Sending…' : 'Send warning'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
