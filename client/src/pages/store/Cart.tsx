import React from 'react';
import { useNavigate } from 'react-router';
import { useCartStore } from '../../store/cartStore';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } =
    useCartStore();

  const totalPrice = getTotalPrice();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">
            Your cart is empty
          </p>
          <button
            onClick={() => navigate('/store')}
            className="text-primary hover:underline"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card"
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <p className="text-muted-foreground">
                  ${item.price.toFixed(2)} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="px-3 py-1 border border-border rounded hover:bg-muted"
                >
                  -
                </button>
                <span className="w-12 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="px-3 py-1 border border-border rounded hover:bg-muted"
                >
                  +
                </button>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded"
              >
                Remove
              </button>
            </div>
          ))}

          <div className="mt-8 p-4 border-t border-border">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold">Total:</span>
              <span className="text-2xl font-bold">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={clearCart}
                className="px-6 py-2 border border-border rounded hover:bg-muted"
              >
                Clear Cart
              </button>
              <button className="flex-1 px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;

