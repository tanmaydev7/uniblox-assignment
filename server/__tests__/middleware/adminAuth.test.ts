import request from 'supertest';
import express, { Express } from 'express';
import { adminAuthMiddleware } from '../../src/middleware/adminAuth';
import { errorHandler } from '../../src/utils/errorUtils';
import { generateAdminToken, createTestAdmin } from '../helpers/testHelpers';

describe('Admin Auth Middleware', () => {
  let app: Express;
  let adminToken: string;
  let admin: any;

  beforeAll(async () => {
    admin = await createTestAdmin('admin', 'password123');
    adminToken = generateAdminToken(admin.id, admin.username);

    app = express();
    app.use(express.json());
    
    // Create a test route protected by middleware
    app.get('/protected', adminAuthMiddleware, (req, res) => {
      res.json({
        success: true,
        admin: req.admin,
      });
    });
    
    app.use(errorHandler);
  });

  describe('Authorization header validation', () => {
    it('should allow access with valid Bearer token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.admin).toHaveProperty('id', admin.id);
      expect(response.body.admin).toHaveProperty('username', admin.username);
      expect(response.body.admin).toHaveProperty('type', 'admin');
    });

    it('should return 401 when Authorization header is missing', async () => {
      const response = await request(app).get('/protected');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('Authorization header is required');
    });

    it('should return 401 when token format is invalid (no Bearer prefix)', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', adminToken);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('Invalid authorization format');
    });

    it('should return 401 when token is empty', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer ');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('Token is required');
    });

    it('should return 401 when token is only whitespace', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer    ');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe(true);
    });
  });

  describe('Token validation', () => {
    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token-here');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('Invalid token');
    });

    it('should return 401 with expired token', async () => {
      // Create an expired token
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const expiredToken = jwt.sign(
        {
          id: admin.id,
          username: admin.username,
          type: 'admin',
        },
        JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('Token has expired');
    });

    it('should return 401 when token type is not admin', async () => {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const userToken = jwt.sign(
        {
          id: 1,
          username: 'user',
          type: 'user',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('Invalid token type');
    });

    it('should return 401 when token payload is missing required fields', async () => {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const invalidToken = jwt.sign(
        {
          username: 'admin',
          type: 'admin',
          // Missing id
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('Invalid token payload');
    });

    it('should attach admin info to request object', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.admin).toBeDefined();
      expect(response.body.admin.id).toBe(admin.id);
      expect(response.body.admin.username).toBe(admin.username);
      expect(response.body.admin.type).toBe('admin');
    });
  });

  describe('Token with wrong secret', () => {
    it('should return 401 when token is signed with wrong secret', async () => {
      const jwt = require('jsonwebtoken');
      const wrongSecretToken = jwt.sign(
        {
          id: admin.id,
          username: admin.username,
          type: 'admin',
        },
        'wrong-secret',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${wrongSecretToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe(true);
    });
  });
});

