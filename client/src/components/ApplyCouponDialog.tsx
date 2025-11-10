import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApplyCouponDialogStore } from '../store/applyCouponDialogStore';
import { useCartStore } from '../store/cartStore';
import { storeAxiosInstance } from '../utils/storeUtils';
import { Loader2 } from 'lucide-react';

interface DiscountItem {
  id: number;
  code: string;
  orderNumber: number;
  discountPercent: number;
  isUsed: boolean;
  usedByOrderId: number | null;
  createdAt: string;
}

interface DiscountResponse {
  data: {
    available: DiscountItem[];
    used: DiscountItem[];
    nextOrderNumber: number;
  };
}

const ApplyCouponDialog: React.FC = () => {
  const { isOpen, closeDialog } = useApplyCouponDialogStore();
  const { applyCoupon } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<DiscountItem[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<DiscountItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCoupons();
    } else {
      // Reset state when dialog closes
      setAvailableCoupons([]);
      setSelectedCoupon(null);
      setError(null);
    }
  }, [isOpen]);

  const fetchCoupons = async () => {
    const mobileNo = localStorage.getItem('userMobileNo');
    if (!mobileNo) {
      setError('Please login first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await storeAxiosInstance.get<DiscountResponse>(
        '/api/v1/store/discounts',
        {
          params: { mobileNo },
        }
      );

      setAvailableCoupons(response.data.data.available);
      
      if (response.data.data.available.length === 0) {
        setError('No available coupons found');
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to fetch coupons';
      setError(errorMessage);
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!selectedCoupon) {
      setError('Please select a coupon');
      return;
    }

    applyCoupon({
      code: selectedCoupon.code,
      discountPercent: selectedCoupon.discountPercent,
    });

    closeDialog();
    setSelectedCoupon(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply Coupon</DialogTitle>
          <DialogDescription>
            Select a coupon to apply discount to your order.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error && availableCoupons.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : availableCoupons.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No available coupons</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {availableCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCoupon?.id === coupon.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedCoupon(coupon)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{coupon.code}</span>
                        <span className="text-sm text-muted-foreground">
                          ({coupon.discountPercent}% off)
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Valid for order #{coupon.orderNumber}
                      </p>
                    </div>
                    {selectedCoupon?.id === coupon.id && (
                      <div className="ml-4">
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-primary-foreground"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && availableCoupons.length > 0 && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => closeDialog()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={loading || !selectedCoupon || availableCoupons.length === 0}
          >
            Apply Coupon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyCouponDialog;

