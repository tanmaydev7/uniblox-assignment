import { Router } from "express";
import { checkout } from "../../controller/client-aka-store/checkout";

const router = Router()
router.post('/', checkout)

export {router as checkoutRoutes}

