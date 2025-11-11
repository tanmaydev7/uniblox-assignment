import React from 'react';
import { useNavigate } from 'react-router';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { useCartStore } from '../../store/cartStore';
import { useLoginDialogStore } from '../../store/loginDialogStore';
import { storeAxiosInstance } from '../../utils/storeUtils';
import { Button } from '@/components/ui/button';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  image: string | null;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const isOutOfStock = product.stock === 0;
  const { items, increaseQuantity, decreaseQuantity } = useCartStore();
  const { openDialog } = useLoginDialogStore();
  
  // Find if this product is in the cart
  const cartItem = items.find((item) => item.id === product.id);
  const quantity = cartItem?.quantity || 0;
  const isInCart = quantity > 0;

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

  const handleCardClick = () => {
    navigate(`/store/product/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking add to cart
    if (isOutOfStock) return;
    
    // Check if user is logged in
    const mobileNo = localStorage.getItem('userMobileNo');
    if (!mobileNo) {
      openDialog();
      return;
    }
    
    increaseQuantity({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      image: product.image,
    });
    debouncedQtyUpdate();
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking increment
    if (quantity > 0) {
      increaseQuantity({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        image: product.image,
      });
      debouncedQtyUpdate()
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking decrement
    if (quantity > 0) {
      decreaseQuantity(product.id);
      debouncedQtyUpdate()
    }
  };

  return (
    <div className="group relative bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Product Image */}
      <div 
        className="aspect-square w-full bg-muted overflow-hidden cursor-pointer"
        onClick={handleCardClick}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-destructive text-white px-4 py-2 rounded-md font-semibold">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 sm:p-4">
        <h3 
          className="font-semibold text-base sm:text-lg text-foreground mb-2 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
          onClick={handleCardClick}
        >
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">
              ₹{product.price.toFixed(2)}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </p>
          </div>
        </div>

        {/* Cart Controls */}
        <div className="mt-3 sm:mt-4">
          {!isInCart ? (
            <Button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full"
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <Button
                onClick={handleDecrement}
                variant="outline"
                size="icon-sm"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <span className="text-base sm:text-lg font-semibold min-w-[2rem] text-center">
                {quantity}
              </span>
              <Button
                onClick={handleIncrement}
                disabled={isOutOfStock || (product.stock > 0 && quantity >= product.stock)}
                variant="outline"
                size="icon-sm"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

