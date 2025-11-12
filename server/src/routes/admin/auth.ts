import { Router } from "express";
import { login } from "../../controller/admin/auth";

const router = Router();

router.post('/login', login);

export { router as authRoutes };

