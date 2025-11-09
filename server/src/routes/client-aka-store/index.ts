import { Router } from "express";
import { productRoutes } from "./product";
import { cartRoutes } from "./cart";

const router = Router()

router.use('/products', productRoutes)
router.use('/cart', cartRoutes)

export default router