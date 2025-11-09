import { Router } from "express";
import { getProducts, getSearchedProducts } from "../../controller/client-aka-store/product";


const router = Router()
router.get('/', getProducts)
router.get('/search', getSearchedProducts)

export {router as productRoutes}