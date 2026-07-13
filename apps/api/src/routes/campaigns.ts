import { Router } from "express";
import { prisma } from "../db/prisma";

const router = Router();

router.get("/active-banner", async (_req, res, next) => {
  try {
    const now = new Date();
    const campaign = await prisma.campaign.findFirst({
      where: {
        isActive: true,
        showOnHomepage: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        type: true,
        bannerTitle: true,
        bannerText: true,
        bannerButtonText: true,
        bannerButtonHref: true,
      },
    });

    res.json({ campaign });
  } catch (err) {
    next(err);
  }
});

export default router;
