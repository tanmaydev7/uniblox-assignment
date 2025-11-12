import { Router } from "express";
import { getCart, updateCart } from "../../controller/client-aka-store/cart";

const router = Router()
router.get('/', getCart)
router.put('/', updateCart)

export {router as cartRoutes}

