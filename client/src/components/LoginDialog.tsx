import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCartStore } from '../store/cartStore';
import { fetchCartFromAPI } from '../utils/storeUtils';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: (mobileNo: string) => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({
  open,
  onOpenChange,
  onLoginSuccess,
}) => {
  const [mobileNo, setMobileNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!mobileNo.trim()) {
      setError('Mobile number is required');
      return;
    }

    // Basic mobile number validation (you can enhance this)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobileNo.trim())) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      // Store mobile number in localStorage
      const trimmedMobileNo = mobileNo.trim();
      localStorage.setItem('userMobileNo', trimmedMobileNo);

      // Fetch user's cart from API
      const cartItems = await fetchCartFromAPI(trimmedMobileNo);
      useCartStore.getState().setCart(cartItems);

      onLoginSuccess(trimmedMobileNo);
      onOpenChange(false);
      setMobileNo('');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to login';
      setError(errorMessage);
      console.error('Error during login:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login</DialogTitle>
          <DialogDescription>
            Enter your mobile number to continue shopping
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label
                htmlFor="mobileNo"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Mobile Number
              </label>
              <input
                id="mobileNo"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={mobileNo}
                onChange={(e) => {
                  setMobileNo(e.target.value);
                  setError(null);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                maxLength={10}
                disabled={loading}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;

