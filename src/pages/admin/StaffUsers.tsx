import type { AdminUser } from '@/types/adminUser.type';
import { useQuery } from '@tanstack/react-query';
import { useDeferredValue, useMemo, useState } from 'react';
import { toast } from 'sonner';
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
import { getAdminRolesQueryOptions } from '@/queries/adminRole.query';
import {
  getAdminUsersQueryOptions,
  useCreateAdminUserMutation,
  useUpdateUserRoleMutation,
} from '@/queries/adminUsers.query';

interface StaffFormState {
  roleId: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
}

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
  const [form, setForm] = useState<StaffFormState>(EMPTY_FORM);
  const [nextRoleId, setNextRoleId] = useState('');
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
    setForm(EMPTY_FORM);
    setCreateOpen(false);
  };

  const handleCreate = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('All staff fields are required.');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Temporary password must be at least 8 characters.');
      return;
    }
    if (!form.roleId) {
      toast.error('Select a staff role.');
      return;
    }

    try {
      await createUser.mutateAsync({
        roleId: form.roleId,
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        password: form.password,
        phone: form.phone.trim(),
      });
      toast.success('Staff user created.');
      resetCreateForm();
      setPage(1);
    }
    catch (error: any) {
      toast.error(error.message ?? 'Failed to create staff user.');
    }
  };

  const handleRoleReassign = async () => {
    if (!reassignUser || !nextRoleId) {
      toast.error('Select a target role.');
      return;
    }

    try {
      await updateUserRole.mutateAsync({
        roleId: nextRoleId,
        userId: reassignUser.id,
      });
      toast.success('Staff role updated.');
      setReassignUser(null);
      setNextRoleId('');
    }
    catch (error: any) {
      toast.error(error.message ?? 'Failed to update staff role.');
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
                    setNextRoleId(user.roleId ?? '');
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

          <div className="
            grid gap-4
            sm:grid-cols-2
          "
          >
            <div className="space-y-2">
              <Label htmlFor="staff-first-name">First name</Label>
              <Input
                id="staff-first-name"
                onChange={event => setForm(current => ({ ...current, firstName: event.target.value }))}
                value={form.firstName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-last-name">Last name</Label>
              <Input
                id="staff-last-name"
                onChange={event => setForm(current => ({ ...current, lastName: event.target.value }))}
                value={form.lastName}
              />
            </div>
            <div className="
              space-y-2
              sm:col-span-2
            "
            >
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                onChange={event => setForm(current => ({ ...current, email: event.target.value }))}
                value={form.email}
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-phone">Phone</Label>
              <Input
                id="staff-phone"
                onChange={event => setForm(current => ({ ...current, phone: event.target.value }))}
                value={form.phone}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-password">Temporary password</Label>
              <Input
                id="staff-password"
                onChange={event => setForm(current => ({ ...current, password: event.target.value }))}
                value={form.password}
                type="password"
              />
            </div>
            <div className="
              space-y-2
              sm:col-span-2
            "
            >
              <Label>Role</Label>
              <Select
                onValueChange={value => setForm(current => ({ ...current, roleId: value }))}
                value={form.roleId}
              >
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
            </div>
          </div>

          <DialogFooter>
            <Button onClick={resetCreateForm} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createUser.isPending}>
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
          setNextRoleId('');
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current role</Label>
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                {reassignUser?.roleName ?? 'No role'}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target role</Label>
              <Select onValueChange={setNextRoleId} value={nextRoleId}>
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
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setReassignUser(null);
                setNextRoleId('');
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleRoleReassign} disabled={updateUserRole.isPending}>
              {updateUserRole.isPending ? 'Saving...' : 'Confirm role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
