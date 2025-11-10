import { Router } from "express";
import { productRoutes } from "./product";
import { cartRoutes } from "./cart";
import { discountRoutes } from "./discount";

const router = Router()

router.use('/products', productRoutes)
router.use('/cart', cartRoutes)
router.use('/discounts', discountRoutes)

export default router