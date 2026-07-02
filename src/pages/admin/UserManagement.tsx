import { useQuery } from '@tanstack/react-query';
import { useDeferredValue, useState } from 'react';
import AdminUsersTable, {
  joinedDate,
  statusBadge,
} from '@/components/admin/AdminUsersTable';
import { Badge } from '@/components/ui/badge';
import { getAdminUsersQueryOptions } from '@/queries/adminUsers.query';

export default function UserManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'ALL' | 'INACTIVE'>('ALL');
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useQuery(
    getAdminUsersQueryOptions({
      page,
      roleType: 'USER',
      search: deferredSearch,
      size: 20,
      status: status === 'ALL' ? undefined : status,
    }),
  );

  const users = data?.data ?? [];
  const total = data?.pagination.total ?? 0;

  return (
    <AdminUsersTable
      title="Platform Users"
      users={users}
      total={total}
      page={page}
      pageSize={20}
      search={search}
      status={status}
      isLoading={isLoading}
      emptyMessage="No platform users match these filters."
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
          key: 'status',
          label: 'Status',
          render: user => statusBadge(user.status),
        },
        {
          key: 'joined',
          label: 'Joined',
          render: user => (
            <span className="text-sm text-muted-foreground">
              {joinedDate(user.createdAt)}
            </span>
          ),
        },
        {
          key: 'consent',
          label: 'Marketing',
          render: user => (
            <Badge variant={user.marketingEmailConsent ? 'default' : 'secondary'}>
              {user.marketingEmailConsent ? 'Subscribed' : 'Opted out'}
            </Badge>
          ),
        },
      ]}
    />
  );
}
