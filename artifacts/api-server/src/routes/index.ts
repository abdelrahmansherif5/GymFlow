import { Router, type IRouter } from "express";
import healthRouter from "./health";
import daysRouter from "./days";
import machinesRouter from "./machines";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(daysRouter);
router.use(machinesRouter);
router.use(settingsRouter);

export default router;
