import { useEffect } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { LayoutDashboard, ShieldCheck, Users, Loader2, ArrowLeft, MessageSquareWarning, Tag, FolderTree, Filter, LifeBuoy, Flag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard },
  { label: "Listings", path: "/admin/listings", icon: ShieldCheck },
  { label: "Orders", path: "/admin/orders", icon: Package },
  { label: "Categories", path: "/admin/categories", icon: FolderTree },
  { label: "Messages", path: "/admin/messages", icon: MessageSquareWarning },
  { label: "Keywords", path: "/admin/flag-keywords", icon: Filter },
  { label: "Reports", path: "/admin/reports", icon: Flag },
  { label: "Help Center", path: "/admin/help", icon: LifeBuoy },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Discounts", path: "/admin/discounts", icon: Tag },
];

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading } = useAdminCheck();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!isLoading && !authLoading && user && isAdmin === false) navigate("/");
  }, [authLoading, user, isAdmin, isLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-heading text-lg font-semibold text-foreground">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Back to store
            </Link>
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b border-border px-4 md:hidden">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-heading text-lg font-semibold text-foreground">Admin</span>
          <div className="ml-auto flex gap-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? "secondary" : "ghost"}
                size="icon"
                asChild
              >
                <Link to={item.path}>
                  <item.icon className="h-4 w-4" />
                </Link>
              </Button>
            ))}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
