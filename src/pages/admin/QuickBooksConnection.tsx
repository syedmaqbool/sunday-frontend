import type { AdminQuickBooksEnvironment } from '@/types/adminQuickBooks.type';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import AccessDenied from '@/components/admin/AccessDenied';
import QuickBooksActivity from '@/components/admin/quickbooks/QuickBooksActivity';
import QuickBooksMappings from '@/components/admin/quickbooks/QuickBooksMappings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAccessControl } from '@/hooks/useAccessControl';
import { showErrorToast } from '@/lib/errorToast';
import {
  getAdminQuickBooksConnectionQueryOptions,
  getAdminQuickBooksRolloutReadinessQueryOptions,
  useReconnectAdminQuickBooksConnectionMutation,
  useStartAdminQuickBooksConnectionMutation,
} from '@/queries/adminQuickBooks.query';

function isQuickBooksEnvironment(value: string | null): value is AdminQuickBooksEnvironment {
  return value === 'SANDBOX' || value === 'PRODUCTION';
}

function formatConnectionDate(value: string | null) {
  if (!value)
    return null;

  return format(new Date(value), 'PPpp');
}

export default function QuickBooksConnection() {
  const { can } = useAccessControl();
  const canReadConnection = can('FINANCE_QUICKBOOKS_CONNECTION_READ');
  const canManageConnection = can('FINANCE_QUICKBOOKS_CONNECTION_MANAGE');
  const canReadMappings = can('FINANCE_QUICKBOOKS_MAPPINGS_READ');
  const canManageMappings = can('FINANCE_QUICKBOOKS_MAPPINGS_MANAGE');
  const canReadSync = can('FINANCE_QUICKBOOKS_SYNC_READ');
  const [searchParameters, setSearchParameters] = useSearchParams();
  const callbackHandled = useRef(false);
  const [environment, setEnvironment] = useState<AdminQuickBooksEnvironment>(() => {
    const callbackEnvironment = searchParameters.get('environment');
    return isQuickBooksEnvironment(callbackEnvironment) ? callbackEnvironment : 'SANDBOX';
  });
  const connectionQuery = useQuery({
    ...getAdminQuickBooksConnectionQueryOptions(environment),
    enabled: canReadConnection,
  });
  const rolloutReadinessQuery = useQuery({
    ...getAdminQuickBooksRolloutReadinessQueryOptions(),
    enabled: canReadSync,
  });
  const startConnection = useStartAdminQuickBooksConnectionMutation();
  const reconnectConnection = useReconnectAdminQuickBooksConnectionMutation();
  const connection = connectionQuery.data?.data;
  const postingEnvironment = canReadSync
    ? rolloutReadinessQuery.data?.data.configuredEnvironment ?? null
    : environment;
  const isPostingEnvironmentConnected = Boolean(postingEnvironment)
    && environment === postingEnvironment
    && connection?.status === 'CONNECTED';
  const isStartingConnection = startConnection.isPending || reconnectConnection.isPending;

  useEffect(() => {
    if (searchParameters.get('quickbooks') !== 'connected' || callbackHandled.current)
      return;

    callbackHandled.current = true;
    toast.success('QuickBooks connected', {
      description: `${environment === 'SANDBOX' ? 'Sandbox' : 'Production'} company is now linked.`,
    });
    setSearchParameters((currentParameters) => {
      const nextParameters = new URLSearchParams(currentParameters);
      nextParameters.delete('quickbooks');
      nextParameters.delete('environment');
      return nextParameters;
    }, { replace: true });
  }, [environment, searchParameters, setSearchParameters]);

  if (!canReadConnection) {
    return (
      <AccessDenied description="QuickBooks connection access is required to view this page." />
    );
  }

  const handleConnect = async () => {
    if (!canManageConnection)
      return;

    try {
      const response = connection?.status === 'DISCONNECTED'
        ? await startConnection.mutateAsync(environment)
        : await reconnectConnection.mutateAsync({ environment });
      location.assign(response.data.authorizationUrl);
    }
    catch (error) {
      showErrorToast(error, 'Could not start QuickBooks authorization.');
    }
  };

  const connectedAt = formatConnectionDate(connection?.connectedAt ?? null);
  const tokenExpiresAt = formatConnectionDate(connection?.accessTokenExpiresAt ?? null);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold">QuickBooks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect Sunday to a QuickBooks Online company for accounting sync.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>QuickBooks connection</CardTitle>
          <CardDescription>
            Choose the QuickBooks environment and authorize the company Sunday should use.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="quickbooks-environment">Environment</Label>
            <Select
              onValueChange={value => setEnvironment(value as AdminQuickBooksEnvironment)}
              value={environment}
            >
              <SelectTrigger id="quickbooks-environment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SANDBOX">Sandbox</SelectItem>
                <SelectItem value="PRODUCTION">Production</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Sandbox is for testing. Select Production only when you are ready to link the live company.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="
              flex flex-col gap-4
              sm:flex-row sm:items-start sm:justify-between
            "
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">Connection status</h2>
                  {connectionQuery.isLoading
                    ? <Badge variant="secondary">Loading</Badge>
                    : connection?.status === 'CONNECTED'
                      ? (
                          <Badge className="gap-1">
                            <CheckCircle2 aria-hidden="true" className="h-3 w-3" />
                            Connected
                          </Badge>
                        )
                      : connection?.status === 'REAUTH_REQUIRED'
                        ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle aria-hidden="true" className="h-3 w-3" />
                              Reauthorization required
                            </Badge>
                          )
                        : <Badge variant="secondary">Not connected</Badge>}
                  {canReadSync && rolloutReadinessQuery.data && (
                    <Badge variant={rolloutReadinessQuery.data.data.externalPostingPaused ? 'secondary' : 'default'}>
                      {rolloutReadinessQuery.data.data.externalPostingPaused ? 'Posting paused' : 'Posting enabled'}
                    </Badge>
                  )}
                </div>
                {connectionQuery.isError
                  ? (
                      <p className="text-sm text-destructive">
                        Could not load the connection status. Retry before connecting.
                      </p>
                    )
                  : connectionQuery.isLoading
                    ? <p className="text-sm text-muted-foreground">Checking the QuickBooks connection…</p>
                    : connection?.status === 'CONNECTED'
                      ? (
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {connectedAt && (
                              <p>
                                Connected
                                {' '}
                                {connectedAt}
                              </p>
                            )}
                            {tokenExpiresAt && (
                              <p>
                                Access token expires
                                {' '}
                                {tokenExpiresAt}
                              </p>
                            )}
                          </div>
                        )
                      : connection?.status === 'REAUTH_REQUIRED'
                        ? <p className="text-sm text-muted-foreground">Authorization needs to be renewed before QuickBooks sync can continue.</p>
                        : <p className="text-sm text-muted-foreground">No QuickBooks company is connected for this environment.</p>}
              </div>

              {connectionQuery.isError
                ? (
                    <Button
                      onClick={() => void connectionQuery.refetch()}
                      variant="outline"
                    >
                      <RefreshCw aria-hidden="true" className="h-4 w-4" />
                      Retry status
                    </Button>
                  )
                : canManageConnection
                  ? (
                      <Button
                        onClick={() => void handleConnect()}
                        disabled={!connection || connectionQuery.isFetching || isStartingConnection}
                      >
                        {isStartingConnection
                          ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                          : <ExternalLink aria-hidden="true" className="h-4 w-4" />}
                        {isStartingConnection
                          ? 'Opening QuickBooks…'
                          : connection?.status === 'DISCONNECTED'
                            ? 'Connect to QuickBooks'
                            : 'Reconnect to QuickBooks'}
                      </Button>
                    )
                  : null}
            </div>
            {!canManageConnection && !connectionQuery.isError && (
              <p className="mt-4 text-xs text-muted-foreground">
                You can view this connection. Ask an administrator for QuickBooks connection management access to connect or reconnect.
              </p>
            )}
            {canReadSync && postingEnvironment && postingEnvironment !== environment && (
              <p className="
                mt-4 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-800
                dark:text-amber-200
              "
              >
                The posting worker is configured for
                {' '}
                {postingEnvironment}
                . Select that environment here to configure mappings and review its entries.
              </p>
            )}
            {canReadSync && rolloutReadinessQuery.isError && (
              <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                Could not determine the backend posting environment. Retry before saving mappings or checking QuickBooks entries.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {(canReadMappings || canManageMappings) && (
        <QuickBooksMappings
          canManageMappings={canManageMappings}
          canReadMappings={canReadMappings}
          isPostingEnvironmentConnected={isPostingEnvironmentConnected}
          postingEnvironment={postingEnvironment}
        />
      )}

      {canReadSync && (
        <QuickBooksActivity
          canReadSync={canReadSync}
          isPostingEnvironmentConnected={isPostingEnvironmentConnected}
          postingEnvironment={postingEnvironment}
        />
      )}
    </div>
  );
}
