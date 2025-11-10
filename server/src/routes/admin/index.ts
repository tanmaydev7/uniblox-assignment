import { Router } from "express";
import { authRoutes } from "./auth";
import { statisticsRoutes } from "./statistics";
import { adminAuthMiddleware } from "../../middleware/adminAuth";

const router = Router();

// Auth routes (login) - no authentication required
router.use('/auth', authRoutes);

// All other admin routes require authentication
router.use(adminAuthMiddleware);

// Protected admin routes
router.use('/statistics', statisticsRoutes);

export default router;

