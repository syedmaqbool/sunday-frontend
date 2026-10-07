import type {
  AdminQuickBooksEnvironment,
  AdminQuickBooksReconciliationRecord,
  AdminQuickBooksSyncEvent,
} from '@/types/adminQuickBooks.type';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getAdminQuickBooksReconciliationQueryOptions,
  getAdminQuickBooksSyncEventsQueryOptions,
} from '@/queries/adminQuickBooks.query';

function formatDate(value: string | null) {
  return value ? format(new Date(value), 'PP') : '—';
}

function formatDateTime(value: string) {
  return format(new Date(value), 'PPpp');
}

function formatStatus(value: string) {
  return value.replaceAll('_', ' ').toLowerCase();
}

function getJournalReportUrl(environment: AdminQuickBooksEnvironment, transactionId: string) {
  const host = environment === 'SANDBOX'
    ? 'https://app.sandbox.qbo.intuit.com'
    : 'https://app.qbo.intuit.com';
  const url = new URL('/app/reportv2', host);
  url.searchParams.set('token', 'TX_JOURNAL');
  url.searchParams.set('txnid', transactionId);
  url.searchParams.set('date_macro', 'all');
  return url.href;
}

function QuickBooksReconciliationRows({ environment, records }: {
  environment: AdminQuickBooksEnvironment;
  records: AdminQuickBooksReconciliationRecord[];
}) {
  if (records.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
          No matching QuickBooks transactions were found for these dates.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {records.map(record => (
        <TableRow key={`${record.recordType}-${record.externalTransactionId ?? record.accountingPostingBatchId ?? record.sourceEventKeys.join('-')}`}>
          <TableCell className="whitespace-nowrap">{formatDate(record.postingDate)}</TableCell>
          <TableCell>
            <Badge variant={record.status === 'MATCHED' ? 'default' : 'secondary'}>
              {formatStatus(record.status)}
            </Badge>
          </TableCell>
          <TableCell className="whitespace-nowrap">
            {record.syncStatus
              ? <Badge variant={record.syncStatus === 'SYNCED' ? 'default' : 'secondary'}>{formatStatus(record.syncStatus)}</Badge>
              : '—'}
          </TableCell>
          <TableCell className="font-mono text-xs">
            {record.externalTransactionId ?? '—'}
          </TableCell>
          <TableCell className="max-w-[300px]">
            <div className="truncate text-xs text-muted-foreground">
              {record.sourceReferences.length > 0
                ? record.sourceReferences.map(reference => `${reference.type}: ${reference.id}`).join(', ')
                : record.recordType.replaceAll('_', ' ')}
            </div>
          </TableCell>
          <TableCell className="text-right">
            {record.recordType === 'BATCH' && record.externalTransactionId
              ? (
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={getJournalReportUrl(environment, record.externalTransactionId)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                      Open journal
                    </a>
                  </Button>
                )
              : '—'}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function SyncEventRows({ events }: { events: AdminQuickBooksSyncEvent[] }) {
  if (events.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
          No QuickBooks sync events were found.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {events.map(event => (
        <TableRow key={event.id}>
          <TableCell className="max-w-[280px] truncate font-mono text-xs">{event.sourceEventKey}</TableCell>
          <TableCell>
            <Badge variant={event.status === 'SYNCED' ? 'default' : event.status === 'FAILED' ? 'destructive' : 'secondary'}>
              {formatStatus(event.status)}
            </Badge>
          </TableCell>
          <TableCell>{event.attemptCount}</TableCell>
          <TableCell className="whitespace-nowrap text-sm">{formatDateTime(event.createdAt)}</TableCell>
          <TableCell title={event.lastError ?? undefined} className="max-w-[320px] truncate text-sm text-muted-foreground">
            {event.lastError ?? '—'}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

interface QuickBooksActivityProps {
  canReadSync: boolean;
  isPostingEnvironmentConnected: boolean;
  postingEnvironment: AdminQuickBooksEnvironment | null;
}

export default function QuickBooksActivity({
  canReadSync,
  isPostingEnvironmentConnected,
  postingEnvironment,
}: QuickBooksActivityProps) {
  const [dateRange, setDateRange] = useState(() => ({
    dateEnd: format(new Date(), 'yyyy-MM-dd'),
    dateStart: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  }));
  const { dateEnd, dateStart } = dateRange;
  const reconciliationParameters = {
    dateEnd,
    dateStart,
    page: 1,
    size: 100,
  } as const;
  const syncEventsParameters = {
    page: 1,
    size: 100,
  } as const;

  const reconciliationQuery = useQuery({
    ...getAdminQuickBooksReconciliationQueryOptions(reconciliationParameters),
    enabled: canReadSync && isPostingEnvironmentConnected,
  });
  const syncEventsQuery = useQuery({
    ...getAdminQuickBooksSyncEventsQueryOptions(syncEventsParameters),
    enabled: canReadSync,
  });

  const refresh = () => {
    void reconciliationQuery.refetch();
    void syncEventsQuery.refetch();
  };

  if (!canReadSync) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>QuickBooks entries</CardTitle>
          <CardDescription>QuickBooks sync read access is required to view journal entries and posting status.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="
            flex flex-col gap-3
            sm:flex-row sm:items-start sm:justify-between
          "
          >
            <div>
              <CardTitle>QuickBooks journal entries</CardTitle>
              <CardDescription>
                Reconciliation compares Sunday posting batches with entries in the configured QuickBooks company.
                The posting worker picks up pending entries after their account and seller vendor mappings become effective.
                {postingEnvironment && (
                  <span className="ml-1">
                    Active posting environment:
                    {' '}
                    {postingEnvironment}
                    .
                  </span>
                )}
              </CardDescription>
            </div>
            <Button onClick={refresh} disabled={reconciliationQuery.isFetching || syncEventsQuery.isFetching} variant="outline">
              <RefreshCw
                aria-hidden="true"
                className={`
                  h-4 w-4
                  ${reconciliationQuery.isFetching || syncEventsQuery.isFetching ? 'animate-spin' : ''}
                `}
              />
              Refresh entries
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="quickbooks-reconciliation-start">Start date</Label>
              <Input
                id="quickbooks-reconciliation-start"
                onChange={event => setDateRange(current => ({ ...current, dateStart: event.target.value }))}
                value={dateStart}
                type="date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quickbooks-reconciliation-end">End date</Label>
              <Input
                id="quickbooks-reconciliation-end"
                onChange={event => setDateRange(current => ({ ...current, dateEnd: event.target.value }))}
                value={dateEnd}
                type="date"
              />
            </div>
            <p className="pb-2 text-xs text-muted-foreground">Choose a range of no more than 31 days.</p>
          </div>

          {!isPostingEnvironmentConnected && (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Connect the configured posting environment to check QuickBooks for journal entries.
            </p>
          )}
          {isPostingEnvironmentConnected && reconciliationQuery.isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">Checking QuickBooks…</p>
          )}
          {isPostingEnvironmentConnected && reconciliationQuery.isError && (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              Could not reconcile entries with QuickBooks. Check the connection and date range, then refresh.
            </p>
          )}
          {isPostingEnvironmentConnected && !reconciliationQuery.isLoading && !reconciliationQuery.isError && (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reconciliation</TableHead>
                    <TableHead>Sync</TableHead>
                    <TableHead>QuickBooks transaction ID</TableHead>
                    <TableHead>Sunday source</TableHead>
                    <TableHead className="text-right">QuickBooks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <QuickBooksReconciliationRows
                    environment={postingEnvironment ?? 'SANDBOX'}
                    records={reconciliationQuery.data?.data ?? []}
                  />
                </TableBody>
              </Table>
            </div>
          )}
          {reconciliationQuery.data && (
            <p className="text-xs text-muted-foreground">
              Showing
              {' '}
              {reconciliationQuery.data.data.length}
              {' '}
              of
              {' '}
              {reconciliationQuery.data.pagination.total}
              {' '}
              reconciliation records.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sync events</CardTitle>
          <CardDescription>
            Pending events are waiting for the posting worker. A synced event includes a QuickBooks transaction ID above when reconciliation finds the journal entry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {syncEventsQuery.isLoading
            ? <p className="py-8 text-center text-sm text-muted-foreground">Loading sync events…</p>
            : syncEventsQuery.isError
              ? <p className="text-sm text-destructive">Could not load QuickBooks sync events.</p>
              : (
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Source event</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Attempts</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Last error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <SyncEventRows events={syncEventsQuery.data?.data ?? []} />
                      </TableBody>
                    </Table>
                  </div>
                )}
          {syncEventsQuery.data && (
            <p className="mt-3 text-xs text-muted-foreground">
              Showing
              {' '}
              {syncEventsQuery.data.data.length}
              {' '}
              of
              {' '}
              {syncEventsQuery.data.pagination.total}
              {' '}
              sync events.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
