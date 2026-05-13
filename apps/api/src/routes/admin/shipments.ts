import { Router } from "express";
import { prisma } from "../../db/prisma";
import * as ke from "../../services/kargoEntegrator";

const router = Router({ mergeParams: true });

function getOrderId(req: Parameters<Parameters<typeof router.get>[1]>[0]) {
  return parseInt((req.params as Record<string, string>).orderId, 10);
}

// GET /api/admin/orders/:orderId/shipment
router.get("/", async (req, res, next) => {
  try {
    const orderId = getOrderId(req);
    const shipment = await prisma.shipment.findUnique({ where: { orderId } });
    if (!shipment) {
      res.status(404).json({ error: "Kargo kaydı bulunamadı." });
      return;
    }
    res.json(shipment);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/orders/:orderId/shipment
router.post("/", async (req, res, next) => {
  try {
    const orderId = getOrderId(req);

    const existing = await prisma.shipment.findUnique({ where: { orderId } });
    if (existing) {
      res.status(400).json({ error: "Bu sipariş için zaten kargo oluşturulmuş." });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    });
    if (!order) {
      res.status(404).json({ error: "Sipariş bulunamadı." });
      return;
    }
    if (order.status !== "PAID" && order.status !== "SHIPPED") {
      res.status(400).json({ error: "Ödeme alınmadan kargo oluşturulamaz." });
      return;
    }

    const keResponse = await ke.createShipment(
      order as unknown as ke.OrderForShipment,
      req.body?.note
    );

    const shipment = await prisma.shipment.create({
      data: {
        orderId,
        keShipmentId: keResponse.id ?? null,
        trackingNumber: keResponse.barcode ?? keResponse.tracking_number ?? null,
        status: keResponse.status ?? "NEW",
        cargoIntegrationId: parseInt(
          process.env.KARGO_ENTEGRATOR_CARGO_INTEGRATION_ID ?? "0",
          10
        ),
        rawResponseJson: keResponse as object,
        syncedAt: new Date(),
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "SHIPPED" },
    });

    res.status(201).json(shipment);
  } catch (err) {
    if (err instanceof ke.KargoEntegratorError) {
      res.status(502).json({ error: `Kargo oluşturulamadı: ${err.message}` });
      return;
    }
    next(err);
  }
});

// POST /api/admin/orders/:orderId/shipment/refresh
router.post("/refresh", async (req, res, next) => {
  try {
    const orderId = getOrderId(req);
    const shipment = await prisma.shipment.findUnique({ where: { orderId } });
    if (!shipment?.keShipmentId) {
      res.status(404).json({ error: "Kargo kaydı bulunamadı." });
      return;
    }

    const keResponse = await ke.getShipment(shipment.keShipmentId);

    const updated = await prisma.shipment.update({
      where: { orderId },
      data: {
        status: keResponse.status ?? shipment.status,
        trackingNumber:
          keResponse.barcode ??
          keResponse.tracking_number ??
          shipment.trackingNumber,
        rawResponseJson: keResponse as object,
        syncedAt: new Date(),
      },
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof ke.KargoEntegratorError) {
      res.status(502).json({ error: `Durum alınamadı: ${err.message}` });
      return;
    }
    next(err);
  }
});

// DELETE /api/admin/orders/:orderId/shipment
router.delete("/", async (req, res, next) => {
  try {
    const orderId = getOrderId(req);
    const shipment = await prisma.shipment.findUnique({ where: { orderId } });
    if (!shipment) {
      res.status(404).json({ error: "Kargo kaydı bulunamadı." });
      return;
    }

    if (shipment.keShipmentId) {
      try {
        await ke.deleteShipment(shipment.keShipmentId);
      } catch (err) {
        if (
          !(err instanceof ke.KargoEntegratorError && err.statusCode === 404)
        ) {
          if (err instanceof ke.KargoEntegratorError) {
            res.status(502).json({ error: `Kargo iptal edilemedi: ${err.message}` });
            return;
          }
          throw err;
        }
      }
    }

    await prisma.shipment.delete({ where: { orderId } });
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID" },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders/:orderId/shipment/label
router.get("/label", async (req, res, next) => {
  try {
    const orderId = getOrderId(req);
    const shipment = await prisma.shipment.findUnique({ where: { orderId } });
    if (!shipment?.keShipmentId) {
      res.status(404).json({ error: "Kargo kaydı bulunamadı." });
      return;
    }

    const pdfBuffer = await ke.printLabel(shipment.keShipmentId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="kargo-${orderId}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    if (err instanceof ke.KargoEntegratorError) {
      res.status(502).json({ error: "Etiket alınamadı, lütfen tekrar deneyin." });
      return;
    }
    next(err);
  }
});

export default router;
