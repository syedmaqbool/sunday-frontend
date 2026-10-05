import type { AdminUserAuditEvent, UpdateAdminUserProfileInput } from '@/types/adminUser.type';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showErrorToast } from '@/lib/errorToast';
import {
  getAdminUserAuditHistoryQueryOptions,
  getAdminUserByIdQueryOptions,
  useUpdateAdminUserProfileMutation,
} from '@/queries/adminUsers.query';

const AUDIT_PAGE_SIZE = 10;

const profileEditFormSchema = z.object({
  address: z.string().trim(),
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
});

type ProfileEditFormValues = z.infer<typeof profileEditFormSchema>;
type ProfileEditControl = ReturnType<typeof useForm<ProfileEditFormValues>>['control'];

const EMPTY_PROFILE: ProfileEditFormValues = {
  address: '',
  firstName: '',
  lastName: '',
};

const AUDIT_FIELD_LABELS: Record<AdminUserAuditEvent['changedFields'][number], string> = {
  address: 'Address',
  firstName: 'First name',
  lastName: 'Last name',
  status: 'Status',
};

export default function AdminUserDetailsDialog({
  userId,
  onClose,
  open,
}: {
  userId: string | null;
  onClose: () => void;
  open: boolean;
}) {
  const [auditPage, setAuditPage] = useState(1);
  const form = useForm<ProfileEditFormValues>({
    defaultValues: EMPTY_PROFILE,
    resolver: zodResolver(profileEditFormSchema),
  });
  const updateProfile = useUpdateAdminUserProfileMutation();
  const { data: detailResponse, isError, isLoading } = useQuery(getAdminUserByIdQueryOptions(userId));
  const {
    data: auditHistoryResponse,
    isError: isAuditHistoryError,
    isLoading: isAuditHistoryLoading,
  } = useQuery(getAdminUserAuditHistoryQueryOptions(userId, { page: auditPage, size: AUDIT_PAGE_SIZE }));
  const user = detailResponse?.data;
  const auditHistory = auditHistoryResponse?.data ?? [];
  const auditPagination = auditHistoryResponse?.pagination;
  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() : '';

  useEffect(() => {
    setAuditPage(1);
  }, [userId]);

  useEffect(() => {
    if (user) {
      form.reset({
        address: user.address,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }
  }, [form, user]);

  const handleProfileSave = async (values: ProfileEditFormValues) => {
    if (!user || !userId)
      return;

    const payload: UpdateAdminUserProfileInput = {};
    if (values.address !== user.address)
      payload.address = values.address;
    if (values.firstName !== user.firstName)
      payload.firstName = values.firstName;
    if (values.lastName !== user.lastName)
      payload.lastName = values.lastName;

    if (Object.keys(payload).length === 0) {
      form.setError('root', {
        message: 'Change at least one profile field before saving.',
        type: 'validate',
      });
      return;
    }

    form.clearErrors('root');
    try {
      await updateProfile.mutateAsync({ userId, payload });
      form.reset(values);
      toast.success('User profile updated.');
    }
    catch (error) {
      showErrorToast(error, 'Failed to update user profile.');
    }
  };

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        if (!isOpen)
          onClose();
      }}
      open={open}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User details</DialogTitle>
          <DialogDescription>Update the user’s name or address and review profile edit history.</DialogDescription>
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
          <div className="space-y-7">
            {user.image && (
              <img
                src={user.image.url}
                alt={`${name || 'User'} profile`}
                height={64}
                width={64}
                className="h-16 w-16 rounded-full object-cover"
              />
            )}

            <form
              id="admin-user-profile-form"
              onSubmit={form.handleSubmit(handleProfileSave)}
              className="space-y-5"
            >
              <dl className="
                grid gap-4
                sm:grid-cols-2
              "
              >
                <EditableDetailField
                  id="admin-user-first-name"
                  name="firstName"
                  control={form.control}
                  error={form.formState.errors.firstName?.message}
                  label="First name"
                />
                <EditableDetailField
                  id="admin-user-last-name"
                  name="lastName"
                  control={form.control}
                  error={form.formState.errors.lastName?.message}
                  label="Last name"
                />
                <DetailField value={user.email} label="Email" />
                <DetailField value={user.phone} label="Phone" />
                <EditableDetailField
                  id="admin-user-address"
                  name="address"
                  control={form.control}
                  error={form.formState.errors.address?.message}
                  label="Address"
                />
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

              {form.formState.errors.root?.message && (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}
            </form>

            <section aria-labelledby="profile-edit-history-heading" className="space-y-3 border-t border-border pt-5">
              <div>
                <h3 id="profile-edit-history-heading" className="font-semibold text-foreground">Profile edit history</h3>
                <p className="text-sm text-muted-foreground">Profile changes show the editor, time, and changed fields.</p>
              </div>

              {isAuditHistoryLoading && (
                <div role="status" className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  Loading profile edit history…
                </div>
              )}

              {isAuditHistoryError && (
                <p role="alert" className="text-sm text-destructive">
                  Unable to load profile edit history. Please try again.
                </p>
              )}

              {!isAuditHistoryLoading && !isAuditHistoryError && auditHistory.length === 0 && (
                <p className="text-sm text-muted-foreground">No profile edits have been recorded.</p>
              )}

              {!isAuditHistoryLoading && !isAuditHistoryError && auditHistory.length > 0 && (
                <ol className="space-y-3">
                  {auditHistory.map(event => (
                    <li key={event.id} className="rounded-md border border-border p-3">
                      <p className="text-sm font-medium text-foreground">
                        Edited by
                        {' '}
                        {formatActorName(event)}
                        {' · '}
                        {formatAuditTimestamp(event.createdAt)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Changed fields:
                        {' '}
                        {event.changedFields.map(field => AUDIT_FIELD_LABELS[field]).join(', ')}
                      </p>
                    </li>
                  ))}
                </ol>
              )}

              {auditPagination && auditPagination.lastPage > 1 && (
                <div className="flex items-center justify-between gap-3">
                  <Button
                    onClick={() => setAuditPage(auditPagination.prevPage ?? 1)}
                    disabled={!auditPagination.prevPage || isAuditHistoryLoading}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Previous page
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page
                    {' '}
                    {auditPagination.currentPage}
                    {' of '}
                    {auditPagination.lastPage}
                  </span>
                  <Button
                    onClick={() => setAuditPage(auditPagination.nextPage ?? auditPage)}
                    disabled={!auditPagination.nextPage || isAuditHistoryLoading}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Next page
                  </Button>
                </div>
              )}
            </section>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose} type="button" variant="outline">
            Close details
          </Button>
          {user && (
            <Button disabled={updateProfile.isPending} form="admin-user-profile-form" type="submit">
              {updateProfile.isPending ? 'Saving…' : 'Save profile'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditableDetailField({
  id,
  control,
  error,
  label,
  name,
}: {
  id: string;
  control: ProfileEditControl;
  error: string | undefined;
  label: string;
  name: keyof ProfileEditFormValues;
}) {
  return (
    <div className="space-y-1">
      <dt>
        <Label htmlFor={id} className="text-sm font-medium text-muted-foreground">
          {label}
        </Label>
      </dt>
      <dd>
        <Controller
          name={name}
          control={control}
          render={({ field }) => <Input {...field} id={id} />}
        />
        {error && <p role="alert" className="mt-1 text-sm text-destructive">{error}</p>}
      </dd>
    </div>
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

function formatActorName(event: AdminUserAuditEvent) {
  return [event.actor.firstName, event.actor.lastName].filter(Boolean).join(' ').trim() || event.actor.email;
}

function formatAuditTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : format(date, 'MMM d, yyyy h:mm a');
}
