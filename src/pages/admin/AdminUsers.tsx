import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth-context";
import { listUsersWithRoles, setUserRole, type UserRole, type UserWithRole } from "@/lib/user-roles";

const roles: UserRole[] = ["donor", "buyer", "partner", "admin"];

const roleBadgeVariant = (role: UserRole) => (role === "admin" ? ("default" as const) : ("secondary" as const));

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const refresh = () => {
    listUsersWithRoles().then(({ data, error }) => {
      if (error) toast.error("Couldn't load users", { description: error });
      setUsers(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleRoleChange = async (targetUserId: string, role: UserRole) => {
    setUpdatingId(targetUserId);
    const { error } = await setUserRole(targetUserId, role);
    setUpdatingId(null);
    if (error) {
      toast.error("Couldn't update role", { description: error });
      return;
    }
    toast.success("Role updated");
    refresh();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Users</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage who has admin access — no SQL required. Promote a teammate to admin, or adjust anyone's role.
      </p>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Change role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isSelf = u.id === user?.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="text-sm">
                      {u.full_name ?? "—"} {isSelf && <span className="text-muted-foreground">(you)</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(u.role)} className="capitalize">
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={u.role}
                        disabled={updatingId === u.id}
                        onValueChange={(v) => handleRoleChange(u.id, v as UserRole)}
                      >
                        <SelectTrigger className="ml-auto w-36" aria-label={`Change role for ${u.email}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r} value={r} disabled={isSelf && r !== "admin"}>
                              <span className="capitalize">{r}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
