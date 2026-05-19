import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

import { dbDebugInfo } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok", dbDebugInfo });
});

export default router;
