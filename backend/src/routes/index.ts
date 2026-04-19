import { Router, type IRouter } from "express";
import healthRouter from "./health";
import smartTouristRouter from "./smart-tourist";

const router: IRouter = Router();

router.use(healthRouter);
router.use(smartTouristRouter);

export default router;
