import React from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { CheckCircle, ShoppingBag, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OrderSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const discountCodeCreated = searchParams.get('discountCodeCreated');

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <CheckCircle className="h-12 w-12 sm:h-14 sm:w-14 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">
            Order Placed Successfully!
          </h1>
          {orderId && (
            <p className="text-muted-foreground text-sm sm:text-base">
              Order ID: <span className="font-semibold text-foreground">#{orderId}</span>
            </p>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-6 sm:p-8 mb-6 sm:mb-8">
          <p className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-6">
            Thank you for your order! We've received your order and will begin processing it shortly.
          </p>

          {discountCodeCreated && (
            <div className="mt-4 sm:mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium text-primary mb-2">
                🎉 Special Offer!
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                You've earned a discount code for your next order:
              </p>
              <p className="text-lg font-bold text-primary">
                {discountCodeCreated}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Use this code at checkout to get 10% off your next order!
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button
            onClick={() => navigate('/store')}
            className="w-full sm:w-auto"
            size="lg"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
          <Button
            onClick={() => navigate('/store')}
            variant="outline"
            className="w-full sm:w-auto"
            size="lg"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;

