import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import projectsRouter from "./projects";
import filesRouter from "./files";
import secretsRouter from "./secrets";
import aiRouter from "./ai";
import statsRouter from "./stats";
import previewRouter from "./preview";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(projectsRouter);
router.use(filesRouter);
router.use(secretsRouter);
router.use(aiRouter);
router.use(statsRouter);
router.use(previewRouter);

export default router;
