import { Router } from "express";
import { authRoutes } from "./auth";
import { adminAuthMiddleware } from "../../middleware/adminAuth";

const router = Router();

// Auth routes (login) - no authentication required
router.use('/auth', authRoutes);

// All other admin routes require authentication
router.use(adminAuthMiddleware);

export default router;

