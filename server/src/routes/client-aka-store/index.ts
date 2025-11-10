import { Router } from "express";
import { productRoutes } from "./product";
import { cartRoutes } from "./cart";
import { discountRoutes } from "./discount";
import { checkoutRoutes } from "./checkout";

const router = Router()

router.use('/products', productRoutes)
router.use('/cart', cartRoutes)
router.use('/discounts', discountRoutes)
router.use('/checkout', checkoutRoutes)

export default router