import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV });
});

export default router;
