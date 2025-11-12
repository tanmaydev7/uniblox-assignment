import React from 'react';
import { useNavigate } from 'react-router';
import { ShoppingBag, Trash2, CreditCard, Minus, Plus, Tag, X } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { storeAxiosInstance } from '../../utils/storeUtils';
import { useCartStore } from '../../store/cartStore';
import { useApplyCouponDialogStore } from '../../store/applyCouponDialogStore';
import { useCheckoutDialogStore } from '../../store/checkoutDialogStore';
import { Button } from '@/components/ui/button';
import ApplyCouponDialog from '../../components/ApplyCouponDialog';
import CheckoutDialog from '../../components/CheckoutDialog';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { items, appliedCoupon, increaseQuantity, decreaseQuantity, clearCart, setCart, removeCoupon } = useCartStore();
  const { openDialog: openCouponDialog } = useApplyCouponDialogStore();
  const { openDialog: openCheckoutDialog } = useCheckoutDialogStore();

  const totalPrice = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Calculate discount
  const discountAmount = appliedCoupon
    ? (totalPrice * appliedCoupon.discountPercent) / 100
    : 0;
  const finalPrice = totalPrice - discountAmount;

  // Debounced cart update API call
  const debouncedQtyUpdate = useDebouncedCallback(
    async () => {
      const mobileNo = localStorage.getItem('userMobileNo');
      if (!mobileNo) return;

      const items = useCartStore.getState().items;
      
      try {
        const payload = {
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        };

        await storeAxiosInstance.put('/api/v1/store/cart', payload, {
          params: { mobileNo },
        });
      } catch (error) {
        console.error('Failed to update cart:', error);
      }
    },
    500 // 500ms debounce delay
  );

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">
            Your cart is empty
          </p>
          <Button
            onClick={() => navigate('/store')}
            variant="link"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-12rem)]">
          {/* Left Half - Scrollable Items List */}
          <div className="flex-1 overflow-y-auto lg:pr-4">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-border rounded-lg bg-card"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full sm:w-20 h-48 sm:h-20 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <h3 className="font-semibold text-base sm:text-lg truncate">{item.name}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      ₹{item.price.toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          decreaseQuantity(item.id);
                          debouncedQtyUpdate();
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <Button
                        onClick={() => {
                          increaseQuantity({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            stock: item.stock,
                            image: item.image,
                          });
                          debouncedQtyUpdate();
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right sm:text-left">
                      <p className="font-bold text-lg">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      // Remove item by filtering it out
                      setCart(items.filter((i) => i.id !== item.id));
                      debouncedQtyUpdate();
                    }}
                    variant="ghost"
                    size="sm"
                    className="w-full sm:w-auto text-destructive hover:bg-destructive/10 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Half - Checkout Summary */}
          <div className="w-full lg:w-1/2 xl:w-96 flex-shrink-0">
            <div className="sticky top-4 border border-border rounded-lg bg-card p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Order Summary</h2>
              
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex justify-between text-sm sm:text-base text-muted-foreground">
                  <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-primary/5 border border-primary/20 rounded-md">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{appliedCoupon.code}</span>
                        <span className="text-xs text-muted-foreground">
                          ({appliedCoupon.discountPercent}% off)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={removeCoupon}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base text-muted-foreground">
                      <span>Discount</span>
                      <span className="text-destructive">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="border-t border-border pt-3 sm:pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl font-bold">Total:</span>
                    <div className="flex flex-col items-end">
                      {appliedCoupon && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{totalPrice.toFixed(2)}
                        </span>
                      )}
                      <span className="text-xl sm:text-2xl font-bold">
                        ₹{finalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={openCouponDialog}
                  variant="outline"
                  className="w-full"
                >
                  <Tag className="h-4 w-4 mr-2" />
                  {appliedCoupon ? 'Change Coupon' : 'Apply Coupon'}
                </Button>
                <Button
                  onClick={openCheckoutDialog}
                  className="w-full text-base sm:text-lg"
                  size="lg"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </Button>
                <Button
                  onClick={() => {
                    clearCart();
                    debouncedQtyUpdate();
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ApplyCouponDialog />
      <CheckoutDialog
        onCheckoutSuccess={(orderId, discountCodeCreated) => {
          // Navigate to order success page with order ID and discount code
          const params = new URLSearchParams({ orderId: orderId.toString() });
          if (discountCodeCreated) {
            params.append('discountCodeCreated', discountCodeCreated);
          }
          navigate(`/store/order-success?${params.toString()}`);
        }}
      />
    </div>
  );
};

export default Cart;

