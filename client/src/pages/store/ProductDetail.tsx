import React from 'react';
import { useParams } from 'react-router';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Product Detail</h1>
      <p className="text-muted-foreground">Product ID: {id}</p>
      <p className="text-muted-foreground mt-2">
        This page will display the product details for product {id}
      </p>
    </div>
  );
};

export default ProductDetail;

