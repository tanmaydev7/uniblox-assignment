import React from 'react';
import { useNavigate } from 'react-router';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import SearchBar from './SearchBar';

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const totalItems = useCartStore((state) => state.getTotalItems());

  const handleCartClick = () => {
    navigate('/store/cart');
  };

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo/Brand */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => navigate('/store')}
          >
            <h1 className="text-xl font-bold text-foreground">Store</h1>
          </div>

          {/* Search Bar */}
          <SearchBar />

          {/* Cart Icon */}
          <div className="relative">
            <button
              onClick={handleCartClick}
              className="relative p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="h-6 w-6 text-foreground" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;

