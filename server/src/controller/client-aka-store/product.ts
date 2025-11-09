import { Request, RequestHandler, Response } from 'express';
import { db } from '../../db';
import { products } from '../../db/schema/products';
import { count } from 'drizzle-orm';
import { generateFailureResponse } from '../../utils/errorUtils';

interface PaginationQuery {
  page?: string;
  limit?: string;
}

interface PaginatedResponse {
  data: typeof products.$inferSelect[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const getProducts: RequestHandler = async (req: Request<{}, PaginatedResponse, {}, PaginationQuery>, res: Response<PaginatedResponse>, next) => {
  try {
    // Parse query parameters with defaults
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);

    // Validate pagination parameters
    if (page < 1) {
      generateFailureResponse('Page must be greater than 0', 400);
    }
    if (limit < 1 || limit > 100) {
      generateFailureResponse('Limit must be between 1 and 100', 400);
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count of products
    const totalCountResult = await db.select({ count: count() }).from(products);
    const totalItems = totalCountResult[0]?.count || 0;

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / limit);

    // Get paginated products
    const productsData = await db
      .select()
      .from(products)
      .limit(limit)
      .offset(offset)
      .orderBy(products.id);

    // Return paginated response
    return res.json({
      data: productsData,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};