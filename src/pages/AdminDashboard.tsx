import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Filter,
  Flag,
  FolderTree,
  Headphones,
  Image as ImageIcon,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  Mail,
  Menu,
  MessageSquareWarning,
  Package,
  Percent,
  Percent as PercentIcon,
  Rocket,
  ShieldCheck,
  Tag,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

type NavItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
      { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
      { label: "Site Settings", path: "/admin/site-settings", icon: ImageIcon },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { label: "Listings", path: "/admin/listings", icon: ShieldCheck },
      { label: "Orders", path: "/admin/orders", icon: Package },
      { label: "Categories", path: "/admin/categories", icon: FolderTree },
      { label: "Brands", path: "/admin/brands", icon: Tag },
      { label: "Discounts", path: "/admin/discounts", icon: Tag },
      { label: "Seller Coupons", path: "/admin/seller-coupons", icon: Tag },
      { label: "Tax Settings", path: "/admin/tax", icon: Percent },
      { label: "Boosts", path: "/admin/boosts", icon: Rocket },
      { label: "Payouts", path: "/admin/payouts", icon: Wallet },
      { label: "Commission", path: "/admin/commission", icon: PercentIcon },
    ],
  },
  {
    label: "Trust & Safety",
    items: [
      { label: "Complaints", path: "/admin/complaints", icon: AlertTriangle },
      {
        label: "Messages",
        path: "/admin/messages",
        icon: MessageSquareWarning,
      },
      { label: "Keywords", path: "/admin/flag-keywords", icon: Filter },
      { label: "Reports", path: "/admin/reports", icon: Flag },
    ],
  },
  {
    label: "Customer",
    items: [
      { label: "Support", path: "/admin/support", icon: Headphones },
      { label: "Help Center", path: "/admin/help", icon: LifeBuoy },
      { label: "Users", path: "/admin/users", icon: Users },
      { label: "Email Templates", path: "/admin/email-templates", icon: Mail },
    ],
  },
];

const allItems: NavItem[] = navSections.flatMap((s) => s.items);

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin } = useAdminCheck();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
    if (!authLoading && user && isAdmin === false) navigate("/");
  }, [authLoading, user, isAdmin, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const currentItem = useMemo(
    () =>
      allItems.find((i) =>
        i.path === "/admin"
          ? location.pathname === "/admin"
          : location.pathname.startsWith(i.path),
      ),
    [location.pathname],
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {navSections.map((section) => (
        <div key={section.label}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {section.label}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active =
                item.path === "/admin"
                  ? location.pathname === "/admin"
                  : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-sm font-semibold text-foreground">
              Admin Panel
            </span>
            <span className="text-[11px] text-muted-foreground">
              Marketplace control
            </span>
          </div>
        </div>
        <NavList />
        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Back to store
            </Link>
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-card shadow-xl animate-in slide-in-from-left">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <span className="font-heading text-sm font-semibold text-foreground">
                  Admin Panel
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <NavList onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-border p-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                asChild
              >
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" /> Back to store
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Admin
            </span>
            <span className="hidden text-muted-foreground/50 sm:inline">/</span>
            <h1 className="truncate font-heading text-base font-semibold text-foreground sm:text-lg">
              {currentItem?.label ?? "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell audience="admin" />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
