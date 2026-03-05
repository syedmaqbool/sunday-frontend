import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trash2, Minus, Plus, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const CartDrawer = () => {
  const { items, removeItem, updateQuantity, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <ShoppingBag className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading text-xl">Your Cart ({totalItems})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Your cart is empty</p>
            <SheetClose asChild>
              <Button variant="outline" size="sm" onClick={() => navigate("/listings")}>
                Browse listings
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="flex flex-col gap-4 py-4">
                {items.map(({ listing, quantity }) => (
                  <div key={listing.id} className="flex gap-3">
                    <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{listing.brand}</p>
                        <p className="text-sm font-medium text-foreground line-clamp-1">{listing.title}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(listing.id, quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-xs font-medium">{quantity}</span>
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(listing.id, quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm font-bold text-foreground">R {(listing.price * quantity).toLocaleString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeItem(listing.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-bold text-foreground">R {totalPrice.toLocaleString()}</span>
              </div>
              <SheetClose asChild>
                <Button className="w-full gap-2" size="lg" onClick={() => navigate("/checkout")}>
                  Checkout <ArrowRight className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
