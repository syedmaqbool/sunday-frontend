import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NEXT_PUBLIC_USE_MOCK_DATA } from "@/lib/mockConfig";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

/* MOCK DATA */
const MOCK_USERS = [
  {
    id: "mock-user-1",
    full_name: "Syed Maqbool",
    avatar_url: null,
    created_at: "2026-06-01T10:30:00Z",
    roles: ["admin"],
  },
  {
    id: "mock-user-2",
    full_name: "Sara Ahmed",
    avatar_url: null,
    created_at: "2026-06-03T14:15:00Z",
    roles: ["seller"],
  },
  {
    id: "mock-user-3",
    full_name: "Usman Tariq",
    avatar_url: null,
    created_at: "2026-06-05T09:00:00Z",
    roles: [],
  },
  {
    id: "mock-user-4",
    full_name: "Fatima Noor",
    avatar_url: null,
    created_at: "2026-06-06T18:40:00Z",
    roles: ["seller"],
  },
];

const UserManagement = () => {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      /* MOCK MODE */
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        return MOCK_USERS;
      }

      /* SUPABASE MODE */
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const roleMap = new Map<string, string[]>();

      (roles ?? []).forEach((r) => {
        const existing = roleMap.get(r.user_id) ?? [];
        existing.push(r.role);
        roleMap.set(r.user_id, existing);
      });

      return (profiles ?? []).map((p) => ({
        ...p,
        roles: roleMap.get(p.id) ?? [],
      }));
    },
  });

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
        {users.length} registered users
      </p>

      <div className="mt-6 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.avatar_url ?? undefined}
                      />

                      <AvatarFallback className="text-xs">
                        {(user.full_name ?? "U")
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <p className="font-medium text-foreground">
                        {user.full_name || "Unnamed"}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {user.id.slice(0, 8)}…
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  {user.roles.length > 0 ? (
                    <div className="flex gap-1">
                      {user.roles.map((r: string) => (
                        <Badge
                          key={r}
                          variant={
                            r === "admin"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {r}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      user
                    </span>
                  )}
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {format(
                    new Date(user.created_at),
                    "MMM d, yyyy"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserManagement;