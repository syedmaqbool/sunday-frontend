import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getAdminUserByIdQueryOptions } from '@/queries/adminUsers.query';

export default function AdminUserDetailsDialog({
  userId,
  onClose,
  open,
}: {
  userId: string | null;
  onClose: () => void;
  open: boolean;
}) {
  const { data, isError, isLoading } = useQuery(getAdminUserByIdQueryOptions(userId));
  const user = data?.data;
  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() : '';

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        if (!isOpen)
          onClose();
      }}
      open={open}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>User details</DialogTitle>
          <DialogDescription>Read-only account details for the selected platform user.</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div role="status" className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
            Loading user details…
          </div>
        )}

        {isError && (
          <p role="alert" className="py-6 text-sm text-destructive">
            Unable to load user details. Please try again.
          </p>
        )}

        {!isLoading && !isError && user && (
          <div className="space-y-5">
            {user.image && (
              <img
                src={user.image.url}
                alt={`${name || 'User'} profile`}
                height={64}
                width={64}
                className="h-16 w-16 rounded-full object-cover"
              />
            )}

            <dl className="
              grid gap-4
              sm:grid-cols-2
            "
            >
              <DetailField value={user.firstName} label="First name" />
              <DetailField value={user.lastName} label="Last name" />
              <DetailField value={user.email} label="Email" />
              <DetailField value={user.phone} label="Phone" />
              <DetailField value={user.address} label="Address" />
              <DetailField value={formatOptionalDate(user.dateOfBirth)} label="Date of birth" />
              <DetailField value={formatOptionalDate(user.createdAt)} label="Signup date" />
              <div className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </Badge>
                </dd>
              </div>
              <DetailField
                value={user.marketingEmailConsent ? 'Consented' : 'Not consented'}
                label="Marketing email consent"
              />
            </dl>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose} type="button" variant="outline">
            Close details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm text-foreground">{value || '—'}</dd>
    </div>
  );
}

function formatOptionalDate(value: string | null | undefined) {
  if (!value)
    return '—';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : format(date, 'MMM d, yyyy');
}
