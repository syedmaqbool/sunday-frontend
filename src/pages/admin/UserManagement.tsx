import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getAdminUsersQueryOptions } from '@/queries/useAdminUsers';

export default function UserManagement() {
  const { data: users = [], isLoading } = useQuery(
    getAdminUsersQueryOptions({ size: 100 }),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground">
        User Management
      </h1>

      <p className="mt-1 text-muted-foreground">
        {users.length}
        {' '}
        registered users
      </p>

      <div className="mt-6 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image?.url ?? undefined} />

                      <AvatarFallback className="text-xs">
                        {(user.username ?? 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <p className="font-medium text-foreground">
                        {user.username || 'Unnamed'}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  {user.roleName
                    ? (
                        <Badge
                          variant={
                            user.roleName === 'ADMIN' ? 'default' : 'secondary'
                          }
                        >
                          {user.roleName}
                        </Badge>
                      )
                    : (
                        <span className="text-xs text-muted-foreground">
                          No role
                        </span>
                      )}
                </TableCell>

                <TableCell>
                  <Badge
                    variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}
                  >
                    {user.status}
                  </Badge>
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(user.createdAt), 'MMM d, yyyy')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
