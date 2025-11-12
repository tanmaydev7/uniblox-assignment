import { Router } from "express";
import { getDiscounts } from "../../controller/client-aka-store/discount";

const router = Router()
router.get('/', getDiscounts)

export {router as discountRoutes}

