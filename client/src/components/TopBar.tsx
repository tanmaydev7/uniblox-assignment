import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingCart, LogIn } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import SearchBar from './SearchBar';
import { Button } from '@/components/ui/button';
import LoginDialog from './LoginDialog';

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const [mobileNo, setMobileNo] = useState<string | null>(null);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  useEffect(() => {
    // Check for mobile number in localStorage on mount
    const storedMobileNo = localStorage.getItem('userMobileNo');
    if (storedMobileNo) {
      setMobileNo(storedMobileNo);
    }
  }, []);

  const handleCartClick = () => {
    navigate('/store/cart');
  };

  const handleLoginSuccess = (mobileNo: string) => {
    setMobileNo(mobileNo);
  };

  const handleLogout = () => {
    localStorage.removeItem('userMobileNo');
    setMobileNo(null);
    // Clear cart on logout
    useCartStore.getState().clearCart();
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

          {/* User/Login and Cart - Desktop only */}
          <div className="hidden sm:flex items-center gap-2 order-2 sm:order-3">
            {mobileNo ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Hi, {mobileNo}
                </span>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsLoginDialogOpen(true)}
                variant="outline"
                size="sm"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            )}
            <div className="relative">
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

          {/* User/Login - Mobile only */}
          <div className="sm:hidden w-full order-2">
            {mobileNo ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-muted-foreground">
                  Hi, {mobileNo}
                </span>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsLoginDialogOpen(true)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
      <LoginDialog
        open={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default TopBar;

