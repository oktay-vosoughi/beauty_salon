import { Router } from "express";
import { z } from "zod";
import { getPayTRStatus, setPayTRCredentials } from "../../services/settings";
import { checkConnection } from "../../services/kargoEntegrator";

const router = Router();

router.get("/paytr", async (_req, res, next) => {
  try {
    const status = await getPayTRStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
});

const paytrSchema = z.object({
  merchantId: z.string().optional(),
  merchantKey: z.string().optional(),
  merchantSalt: z.string().optional(),
  testMode: z.enum(["0", "1"]).optional(),
});

router.patch("/paytr", async (req, res, next) => {
  try {
    const parsed = paytrSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    await setPayTRCredentials(parsed.data);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── Kargo Entegratör ────────────────────────────────────────────────

router.get("/ke", (_req, res) => {
  res.json({
    hasApiKey: !!(process.env.KARGO_ENTEGRATOR_API_KEY),
    hasWarehouseId: !!(process.env.KARGO_ENTEGRATOR_WAREHOUSE_ID),
    hasCargoIntegrationId: !!(process.env.KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID),
    baseUrl: process.env.KARGO_ENTEGRATOR_BASE_URL ?? "https://app.kargoentegrator.com",
    defaultDesi: process.env.KARGO_ENTEGRATOR_DEFAULT_DESI ?? "3",
  });
});

router.post("/ke/test", async (_req, res, next) => {
  try {
    const ok = await checkConnection();
    if (ok) {
      res.json({ ok: true, message: "Kargo Entegratör bağlantısı başarılı." });
    } else {
      res.status(502).json({ ok: false, message: "Kargo Entegratör'e ulaşılamadı. API anahtarını ve URL'yi kontrol edin." });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
