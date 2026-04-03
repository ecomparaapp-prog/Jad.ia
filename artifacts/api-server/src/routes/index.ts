import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import projectsRouter from "./projects";
import filesRouter from "./files";
import secretsRouter from "./secrets";
import aiRouter from "./ai";
import statsRouter from "./stats";
import previewRouter from "./preview";
import assetsRouter from "./assets";
import contextRouter from "./context";
import imagesRouter from "./images";
import githubRouter from "./github";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(projectsRouter);
router.use(filesRouter);
router.use(secretsRouter);
router.use(aiRouter);
router.use(statsRouter);
router.use(previewRouter);
router.use(assetsRouter);
router.use(contextRouter);
router.use(imagesRouter);
router.use(githubRouter);

export default router;
