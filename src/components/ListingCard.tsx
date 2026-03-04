import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Listing } from "@/lib/constants";
import { motion } from "framer-motion";

interface ListingCardProps {
  listing: Listing;
  index?: number;
}

const ListingCard = ({ listing, index = 0 }: ListingCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.35 }}
  >
    <Link to={`/listing/${listing.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background/80 text-muted-foreground opacity-0 backdrop-blur transition-opacity hover:text-primary group-hover:opacity-100"
          onClick={(e) => { e.preventDefault(); }}
        >
          <Heart className="h-4 w-4" />
        </Button>
        <div className="absolute bottom-2 left-2">
          <span className="rounded-sm bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur">
            {listing.condition.replace("_", " ")}
          </span>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{listing.brand}</p>
        <h3 className="text-sm font-medium leading-tight text-foreground line-clamp-1">{listing.title}</h3>
        <p className="text-sm font-semibold text-foreground">R {listing.price.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">Size {listing.size}</p>
      </div>
    </Link>
  </motion.div>
);

export default ListingCard;
