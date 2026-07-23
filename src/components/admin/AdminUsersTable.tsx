import type { ReactNode } from 'react';
import type { AdminUser, AdminUserStatus } from '@/types/adminUser.type';
import { format } from 'date-fns';
import { Loader2, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatEnumLabel } from '@/lib/utilities';

interface Column {
  key: string;
  className?: string;
  label: string;
  render: (user: AdminUser) => React.ReactNode;
}

export default function AdminUsersTable({
  columns,
  emptyMessage,
  headerActions,
  isLoading,
  onPageChange,
  onSearchChange,
  onStatusChange,
  page,
  pageSize,
  search,
  status,
  title,
  total,
  users,
}: {
  columns: Column[];
  emptyMessage: string;
  headerActions?: ReactNode;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: 'ALL' | AdminUserStatus) => void;
  page: number;
  pageSize: number;
  search: string;
  status: 'ALL' | AdminUserStatus;
  title: string;
  total: number;
  users: AdminUser[];
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="space-y-6">
      <div>
        <div className="
          flex flex-col gap-3
          md:flex-row md:items-start md:justify-between
        "
        >
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              {title}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {total}
              {' '}
              users found
            </p>
          </div>
          {headerActions}
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="
            flex flex-col gap-3
            md:flex-row
          "
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                onChange={event => onSearchChange(event.target.value)}
                value={search}
                placeholder="Search by name or email"
                className="pl-9"
              />
            </div>

            <Select
              onValueChange={value => onStatusChange(value as 'ALL' | AdminUserStatus)}
              value={status}
            >
              <SelectTrigger className="
                w-full
                md:w-44
              "
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  {columns.map(column => (
                    <TableHead key={column.key} className={column.className}>
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading
                  ? (
                      <TableRow>
                        <TableCell colSpan={columns.length + 1} className="py-12 text-center">
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  : (users.length === 0
                      ? (
                          <TableRow>
                            <TableCell colSpan={columns.length + 1} className="py-12 text-center text-muted-foreground">
                              {emptyMessage}
                            </TableCell>
                          </TableRow>
                        )
                      : (
                          users.map(user => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage src={user.image?.url ?? undefined} />
                                    <AvatarFallback className="text-xs">
                                      {initials(user)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="truncate font-medium text-foreground">
                                      {fullName(user)}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                      {user.email}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>

                              {columns.map(column => (
                                <TableCell key={column.key} className={column.className}>
                                  {column.render(user)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ))}
              </TableBody>
            </Table>
          </div>

          <div className="
            flex flex-col gap-3 text-sm
            md:flex-row md:items-center md:justify-between
          "
          >
            <p className="text-muted-foreground">
              Showing
              {' '}
              {from}
              -
              {to}
              {' '}
              of
              {' '}
              {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isLoading}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>
              <Button
                onClick={() => onPageChange(page + 1)}
                disabled={to >= total || isLoading}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function fullName(user: AdminUser) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.username || 'Unnamed user';
}

export function statusBadge(status: AdminUserStatus) {
  return (
    <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
      {formatEnumLabel(status)}
    </Badge>
  );
}

export function joinedDate(value: string) {
  return format(new Date(value), 'MMM d, yyyy');
}

function initials(user: AdminUser) {
  const values = [user.firstName, user.lastName]
    .filter(Boolean)
    .map(value => value.charAt(0).toUpperCase());

  if (values.length > 0)
    return values.slice(0, 2).join('');

  return (user.username ?? 'U').charAt(0).toUpperCase();
}
