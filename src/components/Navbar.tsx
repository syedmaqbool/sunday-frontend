import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, User, Menu, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="font-heading text-2xl font-bold tracking-tight text-foreground">
          RESALE
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/listings" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Browse
          </Link>
          <Link to="/listings?category=women" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Women
          </Link>
          <Link to="/listings?category=men" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Men
          </Link>
          <Link to="/listings?category=shoes" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Shoes
          </Link>
          <Link to="/listings?category=bags" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Bags
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/listings")} className="text-muted-foreground hover:text-foreground">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden text-muted-foreground hover:text-foreground md:flex">
            <Heart className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden text-muted-foreground hover:text-foreground md:flex">
            <ShoppingBag className="h-5 w-5" />
          </Button>
          <Button
            variant="default"
            size="sm"
            className="hidden gap-1 md:flex"
            onClick={() => navigate("/create-listing")}
          >
            <Plus className="h-4 w-4" />
            Sell
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground">
            <User className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t border-border bg-background p-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link to="/listings" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Browse All</Link>
            <Link to="/listings?category=women" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Women</Link>
            <Link to="/listings?category=men" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Men</Link>
            <Link to="/listings?category=shoes" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Shoes</Link>
            <Link to="/listings?category=bags" className="text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>Bags</Link>
            <Button variant="default" size="sm" className="mt-2 gap-1" onClick={() => { navigate("/create-listing"); setMobileOpen(false); }}>
              <Plus className="h-4 w-4" /> Sell an Item
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
