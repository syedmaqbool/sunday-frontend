import type { MouseEvent } from 'react';
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

function preventNavigation(event: MouseEvent<HTMLElement>) {
  event.preventDefault();
}

interface LandingNavbarProps {
  navigationDisabled?: boolean;
  onMenuToggle?: () => void;
}

export default function LandingNavbar({
  navigationDisabled = false,
  onMenuToggle,
}: LandingNavbarProps) {
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
        <Link
          onClick={navigationDisabled ? preventNavigation : undefined}
          aria-disabled={navigationDisabled || undefined}
          to="/"
          className="flex items-center"
        >
          <img src={sundayLogo} alt="Sunday" className="h-9 w-auto" />
        </Link>

        <nav className="
          absolute left-1/2 hidden -translate-x-1/2 items-center gap-8
          md:flex
        "
        >
          {navigationLinks.map(link => (
            <Link
              key={link.label}
              onClick={navigationDisabled ? preventNavigation : undefined}
              aria-disabled={navigationDisabled || undefined}
              to={link.to}
              className="
                text-base font-normal text-white/85 transition-colors
                hover:text-white
              "
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            onClick={navigationDisabled ? preventNavigation : () => navigate('/listings')}
            aria-disabled={navigationDisabled || undefined}
            aria-label="Search listings"
            size="icon"
            variant="ghost"
            className="
              text-white
              hover:bg-white/10 hover:text-white
            "
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            onClick={navigationDisabled ? preventNavigation : () => navigate('/listings')}
            aria-disabled={navigationDisabled || undefined}
            aria-label="Saved items"
            size="icon"
            variant="ghost"
            className="
              text-white
              hover:bg-white/10 hover:text-white
            "
          >
            <Heart className="h-5 w-5" />
          </Button>
          <div className="
            [&_button]:text-white
            [&_button]:hover:bg-white/10 [&_button]:hover:text-white
          "
          >
            <CartDrawer navigationDisabled={navigationDisabled} />
          </div>
          <Button
            onClick={navigationDisabled ? preventNavigation : handleSellClick}
            aria-disabled={navigationDisabled || undefined}
            size="sm"
            variant="default"
            className="
              hidden gap-1 rounded-none bg-white px-6 text-xs font-semibold text-[#333333]
              hover:bg-white/90
              md:flex
            "
          >
            <Plus className="h-4 w-4" />
            Sell
          </Button>
          {user
            ? navigationDisabled
              ? (
                  <Button
                    onClick={preventNavigation}
                    aria-disabled="true"
                    aria-label="Open account"
                    size="icon"
                    variant="ghost"
                    className="
                      text-white
                      hover:bg-white/10 hover:text-white
                    "
                  >
                    <User className="h-5 w-5" />
                  </Button>
                )
              : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label="Open account"
                        size="icon"
                        variant="ghost"
                        className="
                          text-white
                          hover:bg-white/10 hover:text-white
                        "
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
                  onClick={navigationDisabled ? preventNavigation : () => navigate('/auth')}
                  aria-disabled={navigationDisabled || undefined}
                  aria-label="Sign in"
                  size="icon"
                  variant="ghost"
                  className="
                    text-white
                    hover:bg-white/10 hover:text-white
                  "
                >
                  <User className="h-5 w-5" />
                </Button>
              )}
          <Button
            onClick={navigationDisabled ? preventNavigation : toggleMobileMenu}
            aria-disabled={navigationDisabled || undefined}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            size="icon"
            variant="ghost"
            className="
              text-white
              hover:bg-white/10 hover:text-white
              md:hidden
            "
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="
          border-t border-white/10 bg-[#777777] p-4
          md:hidden
        "
        >
          <nav className="flex flex-col gap-3">
            {navigationLinks.map(link => (
              <Link
                key={link.label}
                onClick={navigationDisabled ? preventNavigation : () => setMobileOpen(false)}
                aria-disabled={navigationDisabled || undefined}
                to={link.to}
                className="
                  text-sm font-medium text-white/80
                  hover:text-white
                "
              >
                {link.label}
              </Link>
            ))}
            <Button
              onClick={navigationDisabled ? preventNavigation : handleSellClick}
              aria-disabled={navigationDisabled || undefined}
              size="sm"
              variant="default"
              className="
                mt-2 w-full gap-1 rounded-none bg-white text-[#333333]
                hover:bg-white/90
              "
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
