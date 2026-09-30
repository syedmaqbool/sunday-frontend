import type { AdminUser } from '@/types/adminUser.type';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useDeferredValue, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import AdminUsersTable, {
  joinedDate,
  statusBadge,
} from '@/components/admin/AdminUsersTable';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { showErrorToast } from '@/lib/errorToast';
import { getAdminRolesQueryOptions } from '@/queries/adminRole.query';
import {
  getAdminUsersQueryOptions,
  useCreateAdminUserMutation,
  useUpdateUserRoleMutation,
} from '@/queries/adminUsers.query';

const staffCreateFormSchema = z.object({
  roleId: z.string().min(1, 'Select a staff role.'),
  email: z.string().trim().email('Enter a valid email address.'),
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  password: z.string().min(8, 'Temporary password must be at least 8 characters.'),
  phone: z.string().trim().min(1, 'Phone is required.'),
});
const roleReassignFormSchema = z.object({ roleId: z.string().min(1, 'Select a target role.') });

type StaffFormState = z.infer<typeof staffCreateFormSchema>;
type RoleReassignFormValues = z.infer<typeof roleReassignFormSchema>;

const EMPTY_FORM: StaffFormState = {
  roleId: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  phone: '',
};

export default function StaffUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'ALL' | 'INACTIVE'>('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [reassignUser, setReassignUser] = useState<AdminUser | null>(null);
  const form = useForm<StaffFormState>({ defaultValues: EMPTY_FORM, resolver: zodResolver(staffCreateFormSchema) });
  const roleForm = useForm<RoleReassignFormValues>({ defaultValues: { roleId: '' }, resolver: zodResolver(roleReassignFormSchema) });
  const deferredSearch = useDeferredValue(search);

  const { data: usersResponse, isLoading } = useQuery(
    getAdminUsersQueryOptions({
      page,
      roleType: 'STAFF',
      search: deferredSearch,
      size: 20,
      status: status === 'ALL' ? undefined : status,
    }),
  );
  const { data: roles = [] } = useQuery(getAdminRolesQueryOptions());

  const createUser = useCreateAdminUserMutation();
  const updateUserRole = useUpdateUserRoleMutation();

  const roleOptions = useMemo(
    () => roles.map(role => ({ id: role.id, name: role.name })),
    [roles],
  );

  const users = usersResponse?.data ?? [];
  const total = usersResponse?.pagination.total ?? 0;

  const resetCreateForm = () => {
    form.reset(EMPTY_FORM);
    setCreateOpen(false);
  };

  const handleCreate = async (values: StaffFormState) => {
    try {
      await createUser.mutateAsync({
        roleId: values.roleId,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        password: values.password,
        phone: values.phone,
      });
      toast.success('Staff user created.');
      resetCreateForm();
      setPage(1);
    }
    catch (error: any) {
      showErrorToast(error, 'Failed to create staff user.');
    }
  };

  const handleRoleReassign = async (values: RoleReassignFormValues) => {
    if (!reassignUser) {
      return;
    }

    try {
      await updateUserRole.mutateAsync({
        roleId: values.roleId,
        userId: reassignUser.id,
      });
      toast.success('Staff role updated.');
      setReassignUser(null);
      roleForm.reset({ roleId: '' });
    }
    catch (error: any) {
      showErrorToast(error, 'Failed to update staff role.');
    }
  };

  return (
    <>
      <AdminUsersTable
        onPageChange={setPage}
        onSearchChange={(value) => {
          setPage(1);
          setSearch(value);
        }}
        onStatusChange={(value) => {
          setPage(1);
          setStatus(value);
        }}
        columns={[
          {
            key: 'phone',
            label: 'Phone',
            render: user => (
              <span className="text-sm text-muted-foreground">
                {user.phone || '—'}
              </span>
            ),
          },
          {
            key: 'role',
            label: 'Assigned role',
            render: user => user.roleName
              ? (
                  <span className="font-medium text-foreground">{user.roleName}</span>
                )
              : (
                  <span className="text-sm text-muted-foreground">No role</span>
                ),
          },
          {
            key: 'status',
            label: 'Status',
            render: user => statusBadge(user.status),
          },
          {
            key: 'joined',
            label: 'Created',
            render: user => (
              <span className="text-sm text-muted-foreground">
                {joinedDate(user.createdAt)}
              </span>
            ),
          },
          {
            key: 'actions',
            className: 'text-right',
            label: 'Actions',
            render: user => (
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setReassignUser(user);
                    roleForm.reset({ roleId: user.roleId ?? '' });
                  }}
                  size="sm"
                  variant="outline"
                >
                  Reassign role
                </Button>
              </div>
            ),
          },
        ]}
        emptyMessage="No staff users match these filters."
        headerActions={(
          <Button onClick={() => setCreateOpen(true)}>
            Create staff user
          </Button>
        )}
        isLoading={isLoading}
        page={page}
        pageSize={20}
        search={search}
        status={status}
        title="Staff Users"
        total={total}
        users={users}
      />

      <Dialog onOpenChange={open => !open && resetCreateForm()} open={createOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create staff user</DialogTitle>
            <DialogDescription>
              Create a staff account with a temporary password and custom role.
            </DialogDescription>
          </DialogHeader>

          <form
            id="staff-create-form"
            onSubmit={form.handleSubmit(handleCreate, errors => toast.error(Object.values(errors)[0]?.message ?? 'Check the staff fields.'))}
            className="
              grid gap-4
              sm:grid-cols-2
            "
          >
            <div className="space-y-2">
              <Label htmlFor="staff-first-name">First name</Label>
              <Controller name="firstName" control={form.control} render={({ field }) => <Input {...field} id="staff-first-name" />} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-last-name">Last name</Label>
              <Controller name="lastName" control={form.control} render={({ field }) => <Input {...field} id="staff-last-name" />} />
            </div>
            <div className="
              space-y-2
              sm:col-span-2
            "
            >
              <Label htmlFor="staff-email">Email</Label>
              <Controller name="email" control={form.control} render={({ field }) => <Input {...field} id="staff-email" type="email" />} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-phone">Phone</Label>
              <Controller name="phone" control={form.control} render={({ field }) => <Input {...field} id="staff-phone" />} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-password">Temporary password</Label>
              <Controller name="password" control={form.control} render={({ field }) => <Input {...field} id="staff-password" type="password" />} />
            </div>
            <div className="
              space-y-2
              sm:col-span-2
            "
            >
              <Label>Role</Label>
              <Controller
                name="roleId"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </form>

          <DialogFooter>
            <Button onClick={resetCreateForm} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={createUser.isPending} form="staff-create-form" type="submit">
              {createUser.isPending ? 'Creating...' : 'Create staff user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (open) {
            return;
          }

          setReassignUser(null);
          roleForm.reset({ roleId: '' });
        }}
        open={!!reassignUser}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign staff role</DialogTitle>
            <DialogDescription>
              Confirm a new role for
              {' '}
              {reassignUser
                ? `${reassignUser.firstName} ${reassignUser.lastName}`.trim() || reassignUser.email
                : 'this staff user'}
              .
            </DialogDescription>
          </DialogHeader>

          <form id="staff-role-form" onSubmit={roleForm.handleSubmit(handleRoleReassign, errors => toast.error(Object.values(errors)[0]?.message ?? 'Select a target role.'))} className="space-y-4">
            <div className="space-y-2">
              <Label>Current role</Label>
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                {reassignUser?.roleName ?? 'No role'}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target role</Label>
              <Controller
                name="roleId"
                control={roleForm.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </form>

          <DialogFooter>
            <Button
              onClick={() => {
                setReassignUser(null);
                roleForm.reset({ roleId: '' });
              }}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={updateUserRole.isPending} form="staff-role-form" type="submit">
              {updateUserRole.isPending ? 'Saving...' : 'Confirm role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
