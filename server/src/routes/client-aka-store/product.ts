import { Router } from "express";
import { getProducts, getSearchedProducts, getProductById } from "../../controller/client-aka-store/product";


const router = Router()
router.get('/', getProducts)
router.get('/search', getSearchedProducts)
router.get('/product/:productId', getProductById)

export {router as productRoutes}