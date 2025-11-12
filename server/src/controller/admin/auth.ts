import { Request, RequestHandler, Response } from 'express';
import { db } from '../../db';
import { adminUsers } from '../../db/schema/adminUsers';
import { eq } from 'drizzle-orm';
import { generateFailureResponse } from '../../utils/errorUtils';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { StringValue } from "ms";

interface LoginBody {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  admin: {
    id: number;
    username: string;
  };
}

export const login: RequestHandler = async (
  req: Request<{}, LoginResponse, LoginBody>,
  res: Response<LoginResponse>,
  next
) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      generateFailureResponse('Username is required', 400);
    }

    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      generateFailureResponse('Password is required', 400);
    }

    const trimmedUsername = username.trim();

    // Find admin user by username
    const admin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, trimmedUsername))
      .limit(1);

    if (admin.length === 0) {
      generateFailureResponse('Invalid username or password', 401);
    }

    const adminUser = admin[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, adminUser.password);

    if (!isPasswordValid) {
      generateFailureResponse('Invalid username or password', 401);
    }

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '24h') as StringValue;

    const token = jwt.sign(
      {
        id: adminUser.id,
        username: adminUser.username,
        type: 'admin',
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      }
    );

    // Return token and admin info (without password)
    return res.json({
      token,
      admin: {
        id: adminUser.id,
        username: adminUser.username,
      },
    });
  } catch (error) {
    next(error);
  }
};

