import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dorRouter from "./dor";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dorRouter);

export default router;
