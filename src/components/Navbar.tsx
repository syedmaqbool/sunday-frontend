import { Link, useNavigate } from "react-router-dom";
import sundayLogo from "@/assets/sunday-logo.png";
import { Search, Heart, User, Menu, X, Plus, LogOut, Package, MessageSquare, Mail, BarChart3, UserCircle, LifeBuoy } from "lucide-react";
import CartDrawer from "@/components/CartDrawer";
import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories } from "@/hooks/useCategories";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: categories = [] } = useCategories();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center">
          <img src={sundayLogo} alt="Sunday" className="h-10 w-auto" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/listings" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Browse</Link>
          {categories.map(cat => (
            <Link key={cat.id} to={`/listings?parent=${cat.value}`} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {cat.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/listings")} className="text-muted-foreground hover:text-foreground">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden text-muted-foreground hover:text-foreground md:flex">
            <Heart className="h-5 w-5" />
          </Button>
          <span className="hidden md:flex">
            <CartDrawer />
          </span>
          {user && <NotificationBell audience="user" />}
          <Button variant="default" size="sm" className="hidden gap-1 md:flex" onClick={() => navigate(user ? "/create-listing" : "/auth")}>
            <Plus className="h-4 w-4" /> Sell
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <UserCircle className="mr-2 h-4 w-4" /> My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/my-listings")}>
                  <Package className="mr-2 h-4 w-4" /> My Listings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/my-offers")}>
                  <MessageSquare className="mr-2 h-4 w-4" /> My Offers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/messages")}>
                  <Mail className="mr-2 h-4 w-4" /> Messages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/seller-analytics")}>
                  <BarChart3 className="mr-2 h-4 w-4" /> Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/support")}>
                  <LifeBuoy className="mr-2 h-4 w-4" /> Support
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { signOut(); navigate("/"); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground">
              <User className="h-5 w-5" />
            </Button>
          )}

          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background p-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link to="/listings" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Browse All</Link>
            {categories.map(cat => (
              <Link key={cat.id} to={`/listings?parent=${cat.value}`} className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
                {cat.label}
              </Link>
            ))}
            <Button variant="default" size="sm" className="mt-2 gap-1" onClick={() => { navigate(user ? "/create-listing" : "/auth"); setMobileOpen(false); }}>
              <Plus className="h-4 w-4" /> Sell an Item
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
