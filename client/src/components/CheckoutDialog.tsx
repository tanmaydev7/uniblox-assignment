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
import { useCheckoutDialogStore } from '../store/checkoutDialogStore';
import { useCartStore } from '../store/cartStore';
import { storeAxiosInstance } from '../utils/storeUtils';
import { Loader2 } from 'lucide-react';

interface CheckoutResponse {
  data: {
    orderId: number;
    message: string;
    discountCodeCreated?: string;
  };
}

interface CheckoutDialogProps {
  onCheckoutSuccess: (orderId: number, discountCodeCreated?: string) => void;
}

const CheckoutDialog: React.FC<CheckoutDialogProps> = ({ onCheckoutSuccess }) => {
  const { isOpen, closeDialog } = useCheckoutDialogStore();
  const { appliedCoupon, clearCart } = useCartStore();
  const [shippingAddress, setShippingAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!shippingAddress.trim()) {
      setError('Shipping address is required');
      return;
    }

    const mobileNo = localStorage.getItem('userMobileNo');
    if (!mobileNo) {
      setError('Please login first');
      return;
    }

    setLoading(true);

    try {
      const payload: {
        shippingAddress: string;
        discountCode?: string;
      } = {
        shippingAddress: shippingAddress.trim(),
      };

      if (appliedCoupon) {
        payload.discountCode = appliedCoupon.code;
      }

      const response = await storeAxiosInstance.post<CheckoutResponse>(
        '/api/v1/store/checkout',
        payload,
        {
          params: { mobileNo },
        }
      );

      // Clear cart on successful checkout
      clearCart();

      // Close dialog
      closeDialog();
      setShippingAddress('');

      // Call success callback
      onCheckoutSuccess(
        response.data.data.orderId,
        response.data.data.discountCodeCreated
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to checkout';
      setError(errorMessage);
      console.error('Error during checkout:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      closeDialog();
      setShippingAddress('');
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>
            Please enter your shipping address to complete your order.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label
                htmlFor="shippingAddress"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Shipping Address
              </label>
              <textarea
                id="shippingAddress"
                placeholder="Enter your complete shipping address"
                value={shippingAddress}
                onChange={(e) => {
                  setShippingAddress(e.target.value);
                  setError(null);
                }}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
                required
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
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Place Order'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;

