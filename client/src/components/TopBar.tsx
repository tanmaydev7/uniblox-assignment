import React from 'react';
import { useNavigate } from 'react-router';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import SearchBar from './SearchBar';
import { Button } from '@/components/ui/button';

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const totalItems = useCartStore((state) => state.getTotalItems());

  const handleCartClick = () => {
    navigate('/store/cart');
  };

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row h-auto sm:h-16 items-center justify-between gap-3 sm:gap-4 py-3 sm:py-0">
          {/* Logo/Brand */}
          <div
            className="flex items-center cursor-pointer w-full sm:w-auto justify-between sm:justify-start"
            onClick={() => navigate('/store')}
          >
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Store</h1>
            {/* Cart Icon - Mobile only */}
            <div className="relative sm:hidden">
              <Button
                onClick={handleCartClick}
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Shopping cart"
              >
                <ShoppingCart className="h-6 w-6 text-foreground" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="w-full sm:w-auto sm:flex-1 sm:max-w-2xl order-3 sm:order-2">
            <SearchBar />
          </div>

          {/* Cart Icon - Desktop only */}
          <div className="relative hidden sm:block order-2 sm:order-3">
            <Button
              onClick={handleCartClick}
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="h-6 w-6 text-foreground" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;

