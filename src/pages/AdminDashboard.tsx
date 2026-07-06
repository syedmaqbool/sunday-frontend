import {
  ArrowLeft,
  Loader2,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import AccessDenied from '@/components/admin/AccessDenied';
import NotificationBell from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessControl } from '@/hooks/useAccessControl';
import {
  canAccessNavItem,
  findAdminNavItem,
  getFirstAccessibleAdminPath,
  getVisibleAdminSections,
  isNavItemActive,
} from '@/lib/adminNavigation';
import { cn } from '@/lib/utilities';

function AdminNavList({
  onNavigate,
  pathname,
  sections,
}: {
  onNavigate?: () => void;
  pathname: string;
  sections: ReturnType<typeof getVisibleAdminSections>;
}) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {sections.map(section => (
        <div key={section.label}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {section.label}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = isNavItemActive(item.path, pathname);
              return (
                <Link
                  key={item.path}
                  onClick={onNavigate}
                  to={item.path}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all',
                    active
                      ? 'bg-primary/10 text-primary'
                      : `
                        text-muted-foreground
                        hover:bg-muted hover:text-foreground
                      `,
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <item.icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      active
                        ? 'text-primary'
                        : `
                          text-muted-foreground
                          group-hover:text-foreground
                        `,
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
}

export default function AdminDashboard() {
  const { loading: authLoading, user } = useAuth();
  const { canAccessAdminPortal } = useAccessControl();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleSections = useMemo(
    () => getVisibleAdminSections(user),
    [user],
  );
  const currentItem = useMemo(
    () => findAdminNavItem(location.pathname),
    [location.pathname],
  );
  const currentRouteAllowed = useMemo(
    () => (currentItem ? canAccessNavItem(currentItem, user) : false),
    [currentItem, user],
  );
  const firstAccessiblePath = useMemo(
    () => getFirstAccessibleAdminPath(user),
    [user],
  );

  useEffect(() => {
    if (!authLoading && !user)
      navigate('/auth', { replace: true });
    else if (!authLoading && user && !canAccessAdminPortal)
      navigate('/', { replace: true });
  }, [authLoading, canAccessAdminPortal, navigate, user]);

  useEffect(() => {
    if (
      !authLoading
      && user
      && canAccessAdminPortal
      && location.pathname === '/admin'
      && !currentRouteAllowed
      && firstAccessiblePath
      && firstAccessiblePath !== '/admin'
    ) {
      navigate(firstAccessiblePath, { replace: true });
    }
  }, [
    authLoading,
    canAccessAdminPortal,
    currentRouteAllowed,
    firstAccessiblePath,
    location.pathname,
    navigate,
    user,
  ]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canAccessAdminPortal)
    return null;

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="
        hidden w-64 shrink-0 flex-col border-r border-border bg-card
        md:flex
      "
      >
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
        <AdminNavList pathname={location.pathname} sections={visibleSections} />
        <div className="border-t border-border p-3">
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="
              w-full justify-start gap-2 text-muted-foreground
              hover:text-foreground
            "
          >
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              {' '}
              Back to store
            </Link>
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="
          fixed inset-0 z-50
          md:hidden
        "
        >
          <div
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
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
                onClick={() => setMobileOpen(false)}
                size="icon"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AdminNavList
              onNavigate={() => setMobileOpen(false)}
              pathname={location.pathname}
              sections={visibleSections}
            />
            <div className="border-t border-border p-3">
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                  {' '}
                  Back to store
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="
          sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur
          supports-[backdrop-filter]:bg-background/60
          md:px-8
        "
        >
          <Button
            onClick={() => setMobileOpen(true)}
            size="icon"
            variant="ghost"
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="
              hidden text-sm text-muted-foreground
              sm:inline
            "
            >
              Admin
            </span>
            <span className="
              hidden text-muted-foreground/50
              sm:inline
            "
            >
              /
            </span>
            <h1 className="
              truncate font-heading text-base font-semibold text-foreground
              sm:text-lg
            "
            >
              {currentItem?.label ?? 'Admin'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell audience="admin" />
          </div>
        </header>

        <main className="
          flex-1 p-4
          md:p-8
        "
        >
          <div className="mx-auto w-full max-w-7xl">
            {currentItem && currentRouteAllowed
              ? (
                  <Outlet />
                )
              : (
                  <AccessDenied />
                )}
          </div>
        </main>
      </div>
    </div>
  );
}
