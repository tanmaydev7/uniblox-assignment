import { Router } from "express";
import { createGlobalDiscountCodeHandler } from "../../controller/admin/discountCodes";

const router = Router();

router.post('/', createGlobalDiscountCodeHandler);

export { router as discountCodesRoutes };

