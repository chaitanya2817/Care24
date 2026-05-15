import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import chatRouter from "./chat.js";
import assessmentRouter from "./assessment.js";
import reportRouter from "./report.js";
import voiceRouter from "./voice.js";
import userRouter from "./user.js";
import telemedicineRouter from "./telemedicine.js";
import analyticsRouter from "./analytics.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/chat", chatRouter);
router.use("/assessment", assessmentRouter);
router.use("/report", reportRouter);
router.use("/voice", voiceRouter);
router.use("/user", userRouter);
router.use("/telemedicine", telemedicineRouter);
router.use("/analytics", analyticsRouter);

export default router;
