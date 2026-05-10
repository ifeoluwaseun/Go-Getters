import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import tasksRouter from "./tasks";
import goalsRouter from "./goals";
import postsRouter from "./posts";
import evidenceRouter from "./evidence";
import meetingsRouter from "./meetings";
import notificationsRouter from "./notifications";
import leaderboardRouter from "./leaderboard";
import achievementsRouter from "./achievements";
import teamRouter from "./team";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/tasks", tasksRouter);
router.use("/goals", goalsRouter);
router.use("/posts", postsRouter);
router.use("/evidence", evidenceRouter);
router.use("/meetings", meetingsRouter);
router.use("/notifications", notificationsRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/achievements", achievementsRouter);
router.use("/team", teamRouter);

export default router;
