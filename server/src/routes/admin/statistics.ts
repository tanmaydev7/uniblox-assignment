import { Router } from "express";
import { getStatistics } from "../../controller/admin/statistics";

const router = Router();

router.get('/', getStatistics);

export { router as statisticsRoutes };

