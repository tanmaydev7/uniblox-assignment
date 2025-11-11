import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Search, X } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { storeAxiosInstance } from '../utils/storeUtils';
import { Button } from '@/components/ui/button';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  image: string | null;
}

interface SearchResponse {
  data: Product[];
}

const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Search function - memoized with useCallback
  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length === 0) {
      setSearchResults([]);
      setIsSearchOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await storeAxiosInstance.get<SearchResponse>(
        '/api/v1/store/products/search',
        {
          params: { q: query },
        }
      );
      setSearchResults(response.data.data);
      setIsSearchOpen(true);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search callback using useDebounceCallback
  const debouncedSearch = useDebouncedCallback(performSearch, 500);



  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProductClick = (productId: number) => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchOpen(false);
    navigate(`/store/product/${productId}`);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setSearchQuery(e.target.value)
    if(e.target.value) {
      setIsSearching(true)
      setIsSearchOpen(true)
    }
    debouncedSearch(e.target.value)
  }

  return (
    <div ref={searchContainerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (searchResults.length > 0) {
              setIsSearchOpen(true);
            }
          }}
          className="w-full pl-10 pr-10 py-2 text-sm sm:text-base border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
        {searchQuery && (
          <Button
            onClick={handleClear}
            variant="ghost"
            size="icon-sm"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-auto w-auto p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
          {isSearching ? (
            <div className="p-4 text-center text-muted-foreground">
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="px-4 py-3 hover:bg-muted cursor-pointer flex items-center gap-3 transition-colors"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ₹{product.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery.trim().length > 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No products found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

