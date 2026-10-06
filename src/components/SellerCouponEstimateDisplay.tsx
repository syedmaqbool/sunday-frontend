import type { MarketplaceListing } from '@/types/marketplace.type';

type SellerCouponEstimate = NonNullable<MarketplaceListing['sellerCouponEstimate']>;

interface SellerCouponEstimateDisplayProps {
  estimate?: SellerCouponEstimate;
  status: string;
}

function SellerCouponEstimateDisplay({ estimate, status }: SellerCouponEstimateDisplayProps) {
  // Reserved listings are bought through an accepted offer, which never receives seller coupons.
  if (!estimate?.isEstimate || status.toUpperCase() === 'RESERVED') {
    return null;
  }

  return (
    <div data-testid="seller-coupon-estimate" className="text-xs text-muted-foreground">
      <p className="font-medium text-primary">
        Estimated Rs
        {' '}
        {estimate.estimatedPrice.toLocaleString()}
        {' with automatic seller coupon'}
      </p>
      <p>
        {'Save Rs '}
        {estimate.discountAmount.toLocaleString()}
        {' · Applied automatically at checkout'}
      </p>
    </div>
  );
}

export default SellerCouponEstimateDisplay;
