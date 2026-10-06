import { Link } from 'react-router-dom';
import { cn } from '@/lib/utilities';

interface SellerBylineProps {
  sellerId: string;
  className?: string;
  sellerName?: string | null;
  sellerNameClassName?: string;
}

function SellerByline({
  sellerId,
  className,
  sellerName,
  sellerNameClassName,
}: SellerBylineProps) {
  return (
    <p className={cn('pointer-events-none text-xs text-muted-foreground', className)}>
      Sold by
      {' '}
      <Link
        to={`/seller/${sellerId}`}
        className={cn(
          `
            pointer-events-auto relative z-20 font-medium underline-offset-4
            hover:underline
            focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          `,
          sellerNameClassName,
        )}
      >
        {sellerName || 'Seller'}
      </Link>
    </p>
  );
}

export default SellerByline;
