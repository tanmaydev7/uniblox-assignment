import React, { useState, useEffect, useCallback } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { storeAxiosInstance } from '../../utils/storeUtils';
import ProductCard from '../../components/store/ProductCard';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  image: string | null;
}

interface PaginatedResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = 20; // Items per page

  const fetchProducts = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await storeAxiosInstance.get<PaginatedResponse>('/api/v1/store/products', {
        params: {
          page: pageNum,
          limit: limit,
        },
      });

      const { data: newProducts, pagination } = response.data;

      if (append) {
        setProducts((prev) => [...prev, ...newProducts]);
      } else {
        setProducts(newProducts);
      }

      setHasMore(pagination.hasNext);
      setPage(pageNum);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch products';
      setError(errorMessage);
      setHasMore(false);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchProducts(1, false);
  }, [fetchProducts]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchProducts(page + 1, true);
    }
  }, [page, loading, hasMore, fetchProducts]);

  if (error && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Products</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => fetchProducts(1, false)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Products</h1>

        {products.length === 0 && loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          </div>
        ) : (
          <InfiniteScroll
            dataLength={products.length}
            next={loadMore}
            hasMore={hasMore}
            loader={
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading more products...</p>
                </div>
              </div>
            }
            endMessage={
              products.length > 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You've reached the end of the product list</p>
                </div>
              ) : null
            }
            scrollThreshold={0.9}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </InfiniteScroll>
        )}

        {error && products.length > 0 && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-destructive text-sm">{error}</p>
            <button
              onClick={() => fetchProducts(page, false)}
              className="mt-2 text-sm text-destructive underline hover:no-underline"
            >
              Retry loading
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
