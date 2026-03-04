import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MOCK_LISTINGS } from "@/lib/constants";
import { Heart, ShoppingBag, Shield, ArrowLeft } from "lucide-react";

const ListingDetail = () => {
  const { id } = useParams();
  const listing = MOCK_LISTINGS.find(l => l.id === id);

  if (!listing) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container flex flex-1 flex-col items-center justify-center py-20">
          <h1 className="font-heading text-3xl font-bold text-foreground">Listing not found</h1>
          <Link to="/listings" className="mt-4 text-primary hover:underline">Back to browse</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex-1 py-8">
        <Link to="/listings" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Image */}
          <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted">
            <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{listing.brand}</p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-foreground md:text-4xl">{listing.title}</h1>
            <p className="mt-4 text-3xl font-bold text-foreground">R {listing.price.toLocaleString()}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                Size {listing.size}
              </span>
              <span className="rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground capitalize">
                {listing.condition.replace("_", " ")}
              </span>
              <span className="rounded-md border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground capitalize">
                {listing.category}
              </span>
            </div>

            <p className="mt-6 leading-relaxed text-muted-foreground">{listing.description}</p>

            <div className="mt-8 flex gap-3">
              <Button size="lg" className="flex-1 gap-2">
                <ShoppingBag className="h-4 w-4" /> Add to Cart
              </Button>
              <Button variant="outline" size="lg">
                <Heart className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-surface-warm p-4">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Buyer Protection</p>
                <p className="text-xs text-muted-foreground">Money-back guarantee if item isn't as described</p>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                Sold by <span className="font-medium text-foreground">{listing.seller_name}</span>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ListingDetail;
