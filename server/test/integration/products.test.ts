import request from 'supertest';
import app from '../../src/index';
import { createProduct } from '../helpers/testHelpers';

describe('Products API', () => {
  describe('GET /api/v1/store/products', () => {
    it('should return paginated products', async () => {
      await createProduct({ name: 'Product 1', price: 100 });
      await createProduct({ name: 'Product 2', price: 200 });

      const response = await request(app).get('/api/v1/store/products');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.totalItems).toBe(2);
    });

    it('should handle pagination parameters', async () => {
      for (let i = 1; i <= 15; i++) {
        await createProduct({ name: `Product ${i}`, price: i * 10 });
      }

      const response = await request(app).get('/api/v1/store/products?page=2&limit=5');

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.pagination.totalPages).toBe(3);
      expect(response.body.data.length).toBe(5);
    });

    it('should return 400 for invalid page number', async () => {
      const response = await request(app).get('/api/v1/store/products?page=0');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(true);
    });
  });

  describe('GET /api/v1/store/products/search', () => {
    beforeEach(async () => {
      await createProduct({ name: 'iPhone', price: 1000 });
      await createProduct({ name: 'iPad', price: 800 });
      await createProduct({ name: 'Samsung Galaxy', price: 900 });
    });

    it('should return products matching search query', async () => {
      const response = await request(app).get('/api/v1/store/products/search?q=iPhone');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('iPhone');
    });

    it('should perform case-insensitive search', async () => {
      const response = await request(app).get('/api/v1/store/products/search?q=iphone');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });

    it('should return 400 when search query is missing', async () => {
      const response = await request(app).get('/api/v1/store/products/search');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/store/products/product/:productId', () => {
    it('should return product by ID', async () => {
      const product: any = await createProduct({ name: 'Test Product', price: 100 });

      const response = await request(app).get(`/api/v1/store/products/product/${product.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(product.id);
      expect(response.body.data.name).toBe('Test Product');
    });

    it('should return 404 when product does not exist', async () => {
      const response = await request(app).get('/api/v1/store/products/product/999');

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid product ID', async () => {
      const response = await request(app).get('/api/v1/store/products/product/abc');

      expect(response.status).toBe(400);
    });
  });
});

