import type { MarketplaceListing } from '@/types/marketplace.type';

type SellerCouponEstimate = NonNullable<MarketplaceListing['sellerCouponEstimate']>;

interface SellerCouponEstimateDisplayProps {
  estimate?: SellerCouponEstimate;
}

function SellerCouponEstimateDisplay({ estimate }: SellerCouponEstimateDisplayProps) {
  if (!estimate?.isEstimate) {
    return null;
  }

  return (
    <div data-testid="seller-coupon-estimate" className="text-xs text-muted-foreground">
      <p className="font-medium text-primary">Estimated price after seller coupon</p>
      <p>
        Rs
        {' '}
        {estimate.estimatedPrice.toLocaleString()}
        {' · Save Rs '}
        {estimate.discountAmount.toLocaleString()}
      </p>
    </div>
  );
}

export default SellerCouponEstimateDisplay;
