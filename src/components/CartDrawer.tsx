import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import { useCommissionTiers } from '@/hooks/useCommissionTiers';
import { calcCommission } from '@/lib/commission';

function CartDrawer() {
  const { items, removeItem, totalItems, totalPrice, updateQuantity }
    = useCart();
  const navigate = useNavigate();
  const { data: commissionTiers } = useCommissionTiers({ onlyActive: true });

  const itemFees = useMemo(
    () =>
      items.map(({ listing, quantity }) => {
        const c = calcCommission(
          commissionTiers,
          (listing as any).category,
          listing.price,
          quantity,
        );
        return { listingId: listing.id, amount: c.amount, rate: c.rate };
      }),
    [items, commissionTiers],
  );
  const platformFee = itemFees.reduce((s, f) => s + f.amount, 0);
  const totalPayable = totalPrice + platformFee;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="
            relative text-muted-foreground
            hover:text-foreground
          "
        >
          <ShoppingBag className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="
        flex w-full flex-col
        sm:max-w-md
      "
      >
        <SheetHeader>
          <SheetTitle className="font-heading text-xl">
            Your Cart (
            {totalItems}
            )
          </SheetTitle>
        </SheetHeader>

        {items.length === 0
          ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Your cart is empty</p>
                <SheetClose asChild>
                  <Button
                    onClick={() => navigate('/listings')}
                    size="sm"
                    variant="outline"
                  >
                    Browse listings
                  </Button>
                </SheetClose>
              </div>
            )
          : (
              <>
                <ScrollArea className="-mx-6 flex-1 px-6">
                  <div className="flex flex-col gap-4 py-4">
                    {items.map(({ listing, quantity }) => {
                      const fee = itemFees.find(f => f.listingId === listing.id);
                      return (
                        <div key={listing.id} className="flex gap-3">
                          <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex flex-1 flex-col justify-between">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {listing.brand}
                              </p>
                              <p className="line-clamp-1 text-sm font-medium text-foreground">
                                {listing.title}
                              </p>
                              {fee && fee.amount > 0 && (
                                <p className="text-[11px] text-muted-foreground">
                                  + Platform fee (
                                  {fee.rate}
                                  %): Rs
                                  {' '}
                                  {fee.amount.toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Button
                                  onClick={() =>
                                    updateQuantity(listing.id, quantity - 1)}
                                  size="icon"
                                  variant="outline"
                                  className="h-6 w-6"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center text-xs font-medium">
                                  {quantity}
                                </span>
                                <Button
                                  onClick={() =>
                                    updateQuantity(listing.id, quantity + 1)}
                                  size="icon"
                                  variant="outline"
                                  className="h-6 w-6"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-sm font-bold text-foreground">
                                Rs
                                {' '}
                                {(listing.price * quantity).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => removeItem(listing.id)}
                            size="icon"
                            variant="ghost"
                            className="
                              h-6 w-6 flex-shrink-0 text-muted-foreground
                              hover:text-destructive
                            "
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <div className="space-y-2 border-t border-border pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">
                      Rs
                      {' '}
                      {totalPrice.toLocaleString()}
                    </span>
                  </div>
                  {platformFee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Platform fee</span>
                      <span className="text-foreground">
                        Rs
                        {' '}
                        {platformFee.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Total payable
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      Rs
                      {' '}
                      {totalPayable.toLocaleString()}
                    </span>
                  </div>
                  <SheetClose asChild>
                    <Button
                      onClick={() => navigate('/checkout')}
                      size="lg"
                      className="mt-2 w-full gap-2"
                    >
                      Checkout
                      {' '}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </div>
              </>
            )}
      </SheetContent>
    </Sheet>
  );
}

export default CartDrawer;
