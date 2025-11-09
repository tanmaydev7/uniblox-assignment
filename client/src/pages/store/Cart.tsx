import React from 'react';
import { useNavigate } from 'react-router';
import { ShoppingBag, Trash2, CreditCard, Minus, Plus } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { Button } from '@/components/ui/button';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } =
    useCartStore();

  const totalPrice = getTotalPrice();

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
                      ${item.price.toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        variant="outline"
                        size="sm"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <Button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right sm:text-left">
                      <p className="font-bold text-lg">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => removeItem(item.id)}
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
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-xs sm:text-sm">Calculated at checkout</span>
                </div>
                <div className="border-t border-border pt-3 sm:pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl font-bold">Total:</span>
                    <span className="text-xl sm:text-2xl font-bold">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full text-base sm:text-lg" size="lg">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </Button>
                <Button
                  onClick={clearCart}
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
    </div>
  );
};

export default Cart;

