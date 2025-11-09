import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ShoppingCart, Plus, Minus, ArrowLeft, RefreshCw } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { storeAxiosInstance } from '../../utils/storeUtils';
import { useCartStore } from '../../store/cartStore';
import { Button } from '@/components/ui/button';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  image: string | null;
}

interface ProductResponse {
  data: Product;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { items, increaseQuantity, decreaseQuantity } = useCartStore();

  // Find if this product is in the cart
  const cartItem = items.find((item) => item.id === product?.id);
  const quantity = cartItem?.quantity || 0;
  const isInCart = quantity > 0;
  const isOutOfStock = product ? product.stock === 0 : false;

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('Product ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await storeAxiosInstance.get<ProductResponse>(
          `/api/v1/store/products/product/${id}`
        );

        setProduct(response.data.data);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to fetch product';
        setError(errorMessage);
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Debounced increaseQuantity function
  const debouncedIncreaseQuantity = useDebouncedCallback(
    () => {
      if (!product || isOutOfStock) return;
      increaseQuantity({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        image: product.image,
      });
    },
    500 // 500ms debounce delay
  );

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    debouncedIncreaseQuantity();
  };

  const handleIncrement = () => {
    if (!product || quantity === 0) return;
    increaseQuantity({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      image: product.image,
    });
  };

  const handleDecrement = () => {
    if (!product || quantity === 0) return;
    decreaseQuantity(product.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Product</h2>
          <p className="text-muted-foreground mb-4">{error || 'Product not found'}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/store')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Store
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <Button
          onClick={() => navigate('/store')}
          variant="ghost"
          className="mb-4 sm:mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Product Image */}
          <div className="w-full">
            <div className="aspect-square w-full bg-muted rounded-lg overflow-hidden">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <svg
                    className="w-24 h-24"
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
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <span className="bg-destructive text-destructive-foreground px-6 py-3 rounded-md font-semibold text-lg">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {product.name}
            </h1>

            <div className="mb-6">
              <p className="text-4xl sm:text-5xl font-bold text-foreground mb-2">
                ${product.price.toFixed(2)}
              </p>
              <p className="text-sm sm:text-base text-muted-foreground">
                {product.stock > 0 ? (
                  <span className="text-green-600 dark:text-green-400">
                    {product.stock} in stock
                  </span>
                ) : (
                  <span className="text-destructive">Out of stock</span>
                )}
              </p>
            </div>

            {/* Cart Controls */}
            <div className="mt-6 space-y-4">
              {!isInCart ? (
                <Button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="w-full sm:w-auto min-w-[200px]"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 border border-border rounded-lg p-2">
                    <Button
                      onClick={handleDecrement}
                      variant="outline"
                      size="icon"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-xl font-semibold min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <Button
                      onClick={handleIncrement}
                      disabled={isOutOfStock || (product.stock > 0 && quantity >= product.stock)}
                      variant="outline"
                      size="icon"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={() => navigate('/store/cart')}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    View Cart
                  </Button>
                </div>
              )}
            </div>

            {/* Product Description Placeholder */}
            <div className="mt-8 pt-8 border-t border-border">
              <h2 className="text-xl font-semibold mb-4">Product Details</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>Product ID: {product.id}</p>
                <p>Price: ${product.price.toFixed(2)}</p>
                <p>Stock Available: {product.stock} units</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

