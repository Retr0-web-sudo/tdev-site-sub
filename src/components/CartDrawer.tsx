import { useCart } from "@/hooks/useCart";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrency } from "@/lib/currency";

const CartDrawer = () => {
  const { format } = useCurrency();
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalItems, totalPrice } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="w-full sm:max-w-md bg-background border-border flex flex-col">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="font-display text-2xl font-light tracking-wider text-foreground">
            Cart ({totalItems})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <ShoppingBag size={48} className="text-muted-foreground/30" />
            <p className="font-body text-muted-foreground text-sm">Your cart is empty</p>
            <Button
              variant="outline"
              onClick={closeCart}
              className="font-body text-xs tracking-[0.2em] uppercase border-foreground text-foreground hover:bg-foreground hover:text-primary-foreground"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {items.map((item) => {
                const mainImage = item.product.images?.[0];
                const key = `${item.product.id}-${item.selectedSize ?? ""}-${item.selectedColor ?? ""}`;

                return (
                  <div key={key} className="flex gap-4">
                    <Link
                      to={`/product/${item.product.slug}`}
                      onClick={closeCart}
                      className="w-20 h-24 bg-secondary flex-shrink-0 overflow-hidden"
                    >
                      {mainImage ? (
                        <img src={mainImage} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-display text-lg text-muted-foreground/30">
                            {item.product.name[0]}
                          </span>
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <Link
                          to={`/product/${item.product.slug}`}
                          onClick={closeCart}
                          className="font-display text-sm text-foreground hover:text-accent transition-colors truncate pr-2"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.product.id, item.selectedSize, item.selectedColor)}
                          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                          aria-label="Remove item"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {(item.selectedSize || item.selectedColor) && (
                        <p className="font-body text-xs text-muted-foreground mt-1">
                          {[item.selectedColor, item.selectedSize].filter(Boolean).join(" / ")}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-border">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                            className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-3 py-1 font-body text-sm text-foreground min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                            className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="font-body text-sm text-foreground">
                          {format(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-body text-sm tracking-[0.15em] uppercase text-muted-foreground">
                  Subtotal
                </span>
                <span className="font-display text-xl text-foreground">
                  {format(totalPrice)}
                </span>
              </div>
              <p className="font-body text-xs text-muted-foreground">
                Shipping & taxes calculated at checkout.
              </p>
              <Button
                disabled={items.length === 0}
                className="w-full font-body text-xs tracking-[0.2em] uppercase bg-foreground text-primary-foreground hover:bg-foreground/90 py-6 gap-2"
                onClick={() => {
                  closeCart();
                  window.location.href = "/checkout";
                }}
              >
                Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
