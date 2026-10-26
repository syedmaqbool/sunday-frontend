import { useQueries, useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  ChevronDown,
  LifeBuoy,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
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
import CartDrawer from '@/components/CartDrawer';
import NotificationBell from '@/components/NotificationBell';
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
import { getCategoriesOptions } from '@/hooks/useCategories';
import { getSubcategoriesOptions } from '@/queries/categories.query';
import { getClothingTypesOptions } from '@/queries/clothing-types.query';
import { getPublicHeroImageOptions } from '@/queries/siteSettings.query';

const sundayLogo = '/sunday-logo.png';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { canAccessAdminPortal } = useAccessControl();
  const { data: categories = [] } = useQuery(getCategoriesOptions());
  const subcategoryQueries = useQueries({
    queries: categories.map(category => getSubcategoriesOptions(category.id)),
  });
  const subcategoriesByCategory = categories.map((category, index) => ({
    category,
    subcategories: subcategoryQueries[index]?.data?.flatMap(page => page.data) ?? [],
  }));
  const { data: clothingTypePages = [] } = useQuery(getClothingTypesOptions());
  const clothingTypes = clothingTypePages.flatMap(page => page.data);
  const { data: heroData } = useQuery(getPublicHeroImageOptions());

  const siteLogo = (heroData as any)?.siteLogoUrl || sundayLogo;
  const handleSellClick = () => {
    if (user)
      navigate('/create-listing');
    else
      navigate('/auth');
  };

  return (
    <header className="
      sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur
      supports-[backdrop-filter]:bg-background/80
    "
    >
      <div className="
        container flex h-16 items-center justify-between gap-2
        sm:gap-4
      "
      >
        <Link to="/" className="flex items-center">
          <img src={siteLogo} alt="Sunday" className="h-10 w-auto" />
        </Link>

        <nav className="
          hidden items-center gap-8
          md:flex
        "
        >
          <Link
            to="/listings"
            className="
              text-sm font-medium text-muted-foreground transition-colors
              hover:text-foreground
            "
          >
            Browse
          </Link>
          {subcategoriesByCategory.map(({ category, subcategories }) => (
            <div key={category.id} className="group relative flex h-16 items-center">
              <Link
                aria-haspopup="true"
                to={`/listings?parent=${category.value}`}
                className="
                  flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors
                  focus-visible:text-foreground
                  group-hover:text-foreground
                "
              >
                {category.label}
                {' '}
                <ChevronDown className="
                  h-3 w-3 transition-transform
                  group-focus-within:rotate-180
                  group-hover:rotate-180
                "
                />
              </Link>
              <div className="
                invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-0 opacity-0 transition-opacity
                group-focus-within:visible group-focus-within:opacity-100
                group-hover:visible group-hover:opacity-100
              "
              >
                <div className="max-h-[70vh] min-w-[220px] overflow-y-auto rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-lg">
                  <Link
                    to={`/listings?parent=${category.value}`}
                    className="
                      block rounded px-3 py-2 text-sm font-semibold
                      hover:bg-accent hover:text-accent-foreground
                      focus-visible:bg-accent focus-visible:text-accent-foreground
                    "
                  >
                    View all
                    {' '}
                    {category.label}
                  </Link>
                  {subcategories.map(subcategory => (
                    <div key={subcategory.id}>
                      <Link
                        to={`/listings?category=${category.value}-${subcategory.value}`}
                        className="
                          block rounded px-3 py-2 text-sm font-medium
                          hover:bg-accent hover:text-accent-foreground
                          focus-visible:bg-accent focus-visible:text-accent-foreground
                        "
                      >
                        {subcategory.label}
                      </Link>
                      {subcategory.value === 'clothes' && clothingTypes.map(clothingType => (
                        <Link
                          key={clothingType.id}
                          to={`/listings?category=${category.value}-clothes&clothing_type=${clothingType.value}`}
                          className="
                            block rounded py-1.5 pl-6 pr-3 text-sm text-muted-foreground
                            hover:bg-accent hover:text-accent-foreground
                            focus-visible:bg-accent focus-visible:text-accent-foreground
                          "
                        >
                          {clothingType.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>

        <div className="
          flex items-center gap-1
          sm:gap-2
        "
        >
          <Button
            onClick={() => navigate('/listings')}
            size="icon"
            variant="ghost"
            className="
              text-muted-foreground
              hover:text-foreground
            "
          >
            <Search className="h-5 w-5" />
          </Button>
          <CartDrawer />
          {user && <NotificationBell />}

          <Button
            onClick={handleSellClick}
            size="sm"
            variant="default"
            className="
              hidden gap-1
              md:flex
            "
          >
            <Plus className="h-4 w-4" />
            {' '}
            Sell
          </Button>

          {user
            ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="
                        text-muted-foreground
                        hover:text-foreground
                      "
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      disabled
                      className="text-xs text-muted-foreground"
                    >
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <UserCircle className="mr-2 h-4 w-4" />
                      {' '}
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/my-listings')}>
                      <Package className="mr-2 h-4 w-4" />
                      {' '}
                      My Listings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/my-offers')}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {' '}
                      My Offers
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/messages')}>
                      <Mail className="mr-2 h-4 w-4" />
                      {' '}
                      Messages
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/seller-analytics')}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      {' '}
                      Analytics
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/support')}>
                      <LifeBuoy className="mr-2 h-4 w-4" />
                      {' '}
                      Support
                    </DropdownMenuItem>
                    {canAccessAdminPortal && (
                      <>
                        <Separator className="my-1" />
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          <Shield className="mr-2 h-4 w-4" />
                          {' '}
                          Admin Portal
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
                      {' '}
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            : (
                <Button
                  onClick={() => navigate('/auth')}
                  size="icon"
                  variant="ghost"
                  className="
                    text-muted-foreground
                    hover:text-foreground
                  "
                >
                  <User className="h-5 w-5" />
                </Button>
              )}

          <Button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            size="icon"
            variant="ghost"
            className="
              text-muted-foreground
              hover:text-foreground
              md:hidden
            "
          >
            {mobileOpen
              ? (
                  <X className="h-5 w-5" />
                )
              : (
                  <Menu className="h-5 w-5" />
                )}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="
          border-t border-border bg-background p-4
          md:hidden
        "
        >
          <nav className="flex flex-col gap-3">
            <Link
              onClick={() => setMobileOpen(false)}
              to="/listings"
              className="text-sm font-medium text-muted-foreground"
            >
              Browse All
            </Link>
            {categories.map(cat => (
              <Link
                key={cat.id}
                onClick={() => setMobileOpen(false)}
                to={`/listings?parent=${cat.value}`}
                className="text-sm font-medium text-muted-foreground"
              >
                {cat.label}
              </Link>
            ))}
            {canAccessAdminPortal && (
              <Link
                onClick={() => setMobileOpen(false)}
                to="/admin"
                className="text-sm font-medium text-muted-foreground"
              >
                Admin Portal
              </Link>
            )}
            <Button
              onClick={() => {
                handleSellClick();
                setMobileOpen(false);
              }}
              size="sm"
              variant="default"
              className="mt-2 gap-1"
            >
              <Plus className="h-4 w-4" />
              {' '}
              Sell an Item
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
