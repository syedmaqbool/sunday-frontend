import { AlertTriangle, ExternalLink, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SoldListingNotice() {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2 text-left">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="text-xs leading-relaxed text-muted-foreground">
        Sunday bears no responsibility over the shipping method, please ask for shipment proof.
      </p>
    </div>
  );
}

export function ListingDetailsNotice() {
  return (
    <div className="mt-10 flex items-start gap-2 rounded-lg border border-border bg-muted px-4 py-3">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="text-xs leading-relaxed text-muted-foreground">
        Sunday bears no responsibility over the product. Please check all details before buying, and ask any questions when you make an offer.
      </p>
    </div>
  );
}

export function SellerShipmentNotice() {
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <p className="
        text-xs text-amber-700
        dark:text-amber-400
      "
      >
        Please add full details for shipment to ensure no refund disputes.
      </p>
    </div>
  );
}

export function CheckoutDispatchNotice() {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
      <p className="
        text-xs text-amber-800
        dark:text-amber-300
      "
      >
        Item will be dispatched within 3 working days after quality is verified by buyer.
        {' '}
        <Link
          to="/terms"
          className="
            inline-flex items-center gap-1 font-semibold underline underline-offset-2
            hover:text-amber-700
            dark:hover:text-amber-200
          "
        >
          More info
          <ExternalLink className="h-3 w-3" />
        </Link>
      </p>
    </div>
  );
}
