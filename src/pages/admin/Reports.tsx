import type { AdminReport, ReportStatus } from '@/types/adminReport.type';
import { zodResolver } from '@hookform/resolvers/zod';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Flag, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { showErrorToast } from '@/lib/errorToast';
import { formatEnumLabel } from '@/lib/utilities';
import {
  getAdminReportsOptions,
  useResolveReportMutation,
} from '@/queries/adminReport.query';

const STATUS_VARIANT: Record<
  ReportStatus,
  'default' | 'destructive' | 'outline' | 'secondary'
> = {
  DISMISSED: 'outline',
  OPEN: 'destructive',
  RESOLVED: 'secondary',
};

const reportNotesSchema = z.object({ notes: z.record(z.string()) });

function getTargetType(r: AdminReport): 'conversation' | 'listing' | 'message' | 'user' | null {
  if (r.listingId)
    return 'listing';
  if (r.reportedUserId)
    return 'user';
  if (r.messageId)
    return 'message';
  if (r.conversationId)
    return 'conversation';
  return null;
}

function targetLink(r: AdminReport) {
  if (r.listingId)
    return `/listing/${r.listingId}`;
  if (r.reportedUserId)
    return `/seller/${r.reportedUserId}`;
  return null;
}

function Reports() {
  const [filter, setFilter] = useState<'all' | ReportStatus>('OPEN');
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedReportId = searchParams.get('report');
  const form = useForm<z.infer<typeof reportNotesSchema>>({
    defaultValues: { notes: {} },
    resolver: zodResolver(reportNotesSchema),
  });

  const { data: reports = [], isLoading } = useQuery(getAdminReportsOptions(selectedReportId ? 'all' : filter));
  const resolveReport = useResolveReportMutation();

  useEffect(() => {
    if (isLoading || !selectedReportId || reports.some(report => report.id === selectedReportId))
      return;

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('report');
      return next;
    }, { replace: true });
  }, [isLoading, reports, selectedReportId, setSearchParams]);

  const handleUpdate = (
    id: string,
    status: 'DISMISSED' | 'RESOLVED',
    notes?: string,
  ) => {
    resolveReport.mutate(
      { reportId: id, adminNotes: notes, status },
      {
        onError: (error: any) => showErrorToast(error, 'Failed to update report'),
        onSuccess: () => toast.success('Report updated'),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Flag className="h-6 w-6 text-primary" />
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Reports
        </h1>
      </div>

      <Tabs
        onValueChange={(value) => {
          setFilter(value as 'all' | ReportStatus);
          setSearchParams((current) => {
            const next = new URLSearchParams(current);
            next.delete('report');
            return next;
          });
        }}
        value={selectedReportId ? 'all' : filter}
      >
        <TabsList>
          <TabsTrigger value="OPEN">Open</TabsTrigger>
          <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
          <TabsTrigger value="DISMISSED">Dismissed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading
        ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )
        : (reports.length === 0
            ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No reports here.
                  </CardContent>
                </Card>
              )
            : (
                <div className="space-y-3">
                  {reports.map((r) => {
                    const link = targetLink(r);
                    const targetType = getTargetType(r);
                    return (
                      <Card key={r.id} aria-current={r.id === selectedReportId ? 'true' : undefined} data-selected={r.id === selectedReportId || undefined} className={r.id === selectedReportId ? 'border-primary ring-2 ring-primary/20' : undefined}>
                        <CardContent className="space-y-3 p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={STATUS_VARIANT[r.status]}>{formatEnumLabel(r.status)}</Badge>
                            {targetType && (
                              <Badge variant="outline" className="capitalize">
                                {targetType}
                              </Badge>
                            )}
                            <span className="text-sm font-medium text-foreground">
                              {r.reason.replaceAll('_', ' ')}
                            </span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(r.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>

                          {r.details && (
                            <p className="rounded-md bg-muted p-3 text-sm text-foreground">
                              {r.details}
                            </p>
                          )}

                          {r.listingTitle && (
                            <p className="text-xs text-muted-foreground">
                              Listing:
                              {' '}
                              <span className="text-foreground">{r.listingTitle}</span>
                            </p>
                          )}
                          {r.messageContent && (
                            <p className="rounded-md bg-muted/50 p-2 text-xs italic text-muted-foreground">
                              "
                              {r.messageContent}
                              "
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>
                              Reporter:
                              {' '}
                              <span className="text-foreground">
                                {r.reporterFullName}
                              </span>
                            </span>
                            {r.reportedUserFullName && (
                              <span>
                                Reported:
                                {' '}
                                <span className="text-foreground">
                                  {r.reportedUserFullName}
                                </span>
                              </span>
                            )}
                            {link && (
                              <Link
                                to={link}
                                className="
                                  inline-flex items-center gap-1 text-primary
                                  hover:underline
                                "
                              >
                                View
                                {' '}
                                {targetType}
                                {' '}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>

                          {r.status !== 'OPEN' && (
                            <p className="text-xs text-muted-foreground">
                              Resolved by
                              {' '}
                              {r.resolverFullName ?? '—'}
                              {' '}
                              ·
                              {' '}
                              {r.resolvedAt
                                ? formatDistanceToNow(new Date(r.resolvedAt), {
                                    addSuffix: true,
                                  })
                                : '—'}
                            </p>
                          )}

                          <Controller
                            name={`notes.${r.id}`}
                            control={form.control}
                            defaultValue={r.adminNotes ?? ''}
                            render={({ field }) => <Textarea {...field} placeholder="Admin notes..." rows={2} />}
                          />

                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={form.handleSubmit(values => handleUpdate(r.id, 'RESOLVED', values.notes[r.id] ?? r.adminNotes ?? ''))}
                              disabled={resolveReport.isPending}
                              size="sm"
                              type="button"
                            >
                              Resolve
                            </Button>
                            <Button
                              onClick={form.handleSubmit(values => handleUpdate(r.id, 'DISMISSED', values.notes[r.id] ?? r.adminNotes ?? ''))}
                              disabled={resolveReport.isPending}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Dismiss
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ))}
    </div>
  );
}

export default Reports;
