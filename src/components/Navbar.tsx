import { useQueries, useQuery } from '@tanstack/react-query';
import {
  BarChart3,
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
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
  const [openCategoryMenu, setOpenCategoryMenu] = useState('');
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
          <NavigationMenu value={openCategoryMenu} onValueChange={setOpenCategoryMenu}>
            <NavigationMenuList className="gap-4 space-x-0">
              {subcategoriesByCategory.map(({ category, subcategories }) => (
                <NavigationMenuItem key={category.id} value={category.id}>
                  <NavigationMenuTrigger
                    className="h-auto rounded-none bg-transparent px-0 py-2 text-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground focus:bg-transparent data-[state=open]:bg-transparent"
                    onFocus={() => setOpenCategoryMenu(category.id)}
                  >
                    {category.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="min-w-52 rounded-md border bg-popover p-3 shadow-md">
                    <ul className="flex min-w-48 flex-col gap-1">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            className="block rounded-sm px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            to={`/listings?parent=${category.value}`}
                          >
                            Browse
                            {' '}
                            {category.label}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      {subcategories.map(subcategory => (
                        <li key={subcategory.id}>
                          <NavigationMenuLink asChild>
                            <Link
                              className="block rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              to={`/listings?category=${category.value}-${subcategory.value}`}
                            >
                              {subcategory.label}
                            </Link>
                          </NavigationMenuLink>
                          {subcategory.value === 'clothes' && clothingTypes.length > 0 && (
                            <ul className="ml-4 border-l pl-2">
                              {clothingTypes.map(clothingType => (
                                <li key={clothingType.id}>
                                  <NavigationMenuLink asChild>
                                    <Link
                                      className="block rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                      to={`/listings?category=${category.value}-${subcategory.value}&clothing_type=${clothingType.value}`}
                                    >
                                      {clothingType.label}
                                    </Link>
                                  </NavigationMenuLink>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
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
