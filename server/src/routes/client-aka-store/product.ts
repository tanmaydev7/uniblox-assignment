import { Router } from "express";
import { getProducts } from "../../controller/client-aka-store/product";


const router = Router()
router.get('/', getProducts)

export {router as productRoutes}