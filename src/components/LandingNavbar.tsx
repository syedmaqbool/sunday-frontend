import {
  BarChart3,
  Heart,
  LifeBuoy,
  LogOut,
  Mail,
  Menu,
  Package,
  Plus,
  Search,
  Shield,
  User,
  UserCircle,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import sundayLogo from '@/assets/sndy-logo.png';
import CartDrawer from '@/components/CartDrawer';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessControl } from '@/hooks/useAccessControl';

const navigationLinks = [
  { label: 'Browse', to: '/listings' },
  { label: 'Women', to: '/listings?category=women' },
  { label: 'Men', to: '/listings?category=men' },
  { label: 'Children', to: '/listings?category=children' },
];

interface LandingNavbarProps {
  onMenuToggle?: () => void;
}

export default function LandingNavbar({ onMenuToggle }: LandingNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { canAccessAdminPortal } = useAccessControl();

  const toggleMobileMenu = () => {
    setMobileOpen(open => !open);
    onMenuToggle?.();
  };

  const handleSellClick = () => {
    navigate(user ? '/create-listing' : '/auth');
  };

  return (
    <header className="relative z-20 border-b border-white/10 bg-[#777777] text-white">
      <div className="relative flex h-20 items-center justify-between gap-4 px-[4vw]">
        <Link className="flex items-center" to="/">
          <img alt="Sunday" className="h-9 w-auto" src={sundayLogo} />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {navigationLinks.map(link => (
            <Link
              key={link.label}
              className="text-base font-normal text-white/85 transition-colors hover:text-white"
              to={link.to}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            aria-label="Search listings"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => navigate('/listings')}
            size="icon"
            variant="ghost"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            aria-label="Saved items"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => navigate('/listings')}
            size="icon"
            variant="ghost"
          >
            <Heart className="h-5 w-5" />
          </Button>
          <div className="[&_button]:text-white [&_button]:hover:bg-white/10 [&_button]:hover:text-white">
            <CartDrawer />
          </div>
          <Button
            className="hidden gap-1 rounded-none bg-white px-6 text-xs font-semibold text-[#333333] hover:bg-white/90 md:flex"
            onClick={handleSellClick}
            size="sm"
            variant="default"
          >
            <Plus className="h-4 w-4" />
            Sell
          </Button>
          {user
            ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      aria-label="Open account"
                      className="text-white hover:bg-white/10 hover:text-white"
                      size="icon"
                      variant="ghost"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <UserCircle className="mr-2 h-4 w-4" />
                      My profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/my-listings')}>
                      <Package className="mr-2 h-4 w-4" />
                      My listings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/my-offers')}>
                      <Mail className="mr-2 h-4 w-4" />
                      My offers
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/messages')}>
                      <Mail className="mr-2 h-4 w-4" />
                      Messages
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/seller-analytics')}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analytics
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/support')}>
                      <LifeBuoy className="mr-2 h-4 w-4" />
                      Support
                    </DropdownMenuItem>
                    {canAccessAdminPortal && (
                      <>
                        <Separator className="my-1" />
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          <Shield className="mr-2 h-4 w-4" />
                          Admin portal
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => {
                        signOut();
                        navigate('/');
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            : (
                <Button
                  aria-label="Sign in"
                  className="text-white hover:bg-white/10 hover:text-white"
                  onClick={() => navigate('/auth')}
                  size="icon"
                  variant="ghost"
                >
                  <User className="h-5 w-5" />
                </Button>
              )}
          <Button
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="text-white hover:bg-white/10 hover:text-white md:hidden"
            onClick={toggleMobileMenu}
            size="icon"
            variant="ghost"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#777777] p-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {navigationLinks.map(link => (
              <Link
                key={link.label}
                className="text-sm font-medium text-white/80 hover:text-white"
                onClick={() => setMobileOpen(false)}
                to={link.to}
              >
                {link.label}
              </Link>
            ))}
            <Button
              className="mt-2 w-full gap-1 rounded-none bg-white text-[#333333] hover:bg-white/90"
              onClick={handleSellClick}
              size="sm"
              variant="default"
            >
              <Plus className="h-4 w-4" />
              Sell an item
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
