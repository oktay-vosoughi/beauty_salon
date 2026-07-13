import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db/prisma";

const router = Router();

const campaignBaseSchema = z.object({
  slug: z.string().min(1).max(191).regex(/^[a-z0-9-]+$/, "Slug sadece küçük harf, rakam ve tire içerebilir"),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).nullable().optional(),
  type: z.enum(["BUY_2_GET_2", "PERCENT_DISCOUNT", "BUY_X_PAY_Y"]).default("BUY_2_GET_2"),
  discountPercent: z.number().positive().max(100).nullable().optional(),
  buyQuantity: z.number().int().min(2).max(99).nullable().optional(),
  payQuantity: z.number().int().min(1).max(98).nullable().optional(),
  isActive: z.boolean().default(true),
  showOnHomepage: z.boolean().default(false),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  bannerTitle: z.string().max(255).nullable().optional(),
  bannerText: z.string().max(1000).nullable().optional(),
  bannerButtonText: z.string().max(100).nullable().optional(),
  bannerButtonHref: z.string().max(191).nullable().optional(),
});

const campaignSchema = campaignBaseSchema.superRefine((data, ctx) => {
  if (data.type === "PERCENT_DISCOUNT" && !data.discountPercent) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discountPercent"],
      message: "Yüzde indirim için indirim yüzdesi zorunludur",
    });
  }

  if (data.type === "BUY_X_PAY_Y") {
    if (!data.buyQuantity || !data.payQuantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["buyQuantity"],
        message: "X Al Y Öde için toplam ürün ve ödenecek ürün zorunludur",
      });
      return;
    }
    if (data.payQuantity >= data.buyQuantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payQuantity"],
        message: "Ödenecek ürün sayısı toplam ürün sayısından küçük olmalıdır",
      });
    }
  }
});

const campaignUpdateSchema = campaignBaseSchema.partial().superRefine((data, ctx) => {
  if (data.type === "PERCENT_DISCOUNT" && !data.discountPercent) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discountPercent"],
      message: "Yüzde indirim için indirim yüzdesi zorunludur",
    });
  }

  if (data.type === "BUY_X_PAY_Y") {
    if (!data.buyQuantity || !data.payQuantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["buyQuantity"],
        message: "X Al Y Öde için toplam ürün ve ödenecek ürün zorunludur",
      });
      return;
    }
    if (data.payQuantity >= data.buyQuantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payQuantity"],
        message: "Ödenecek ürün sayısı toplam ürün sayısından küçük olmalıdır",
      });
    }
  }
});

type CampaignInput = z.infer<typeof campaignSchema>;
type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;

router.get("/", async (_req, res, next) => {
  try {
    const items = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: Number(req.params.id) } });
    if (!campaign) {
      res.status(404).json({ error: "Kampanya bulunamadı" });
      return;
    }
    res.json(campaign);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = campaignSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Geçersiz veri" });
      return;
    }

    const campaign = await prisma.campaign.create({ data: toCampaignCreateData(parsed.data) });
    res.status(201).json(campaign);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      res.status(409).json({ error: "Bu kampanya slug değeri zaten kullanılıyor" });
      return;
    }
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = campaignUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Geçersiz veri" });
      return;
    }

    const campaign = await prisma.campaign.update({
      where: { id: Number(req.params.id) },
      data: toCampaignUpdateData(parsed.data),
    });
    res.json(campaign);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.campaign.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

function toCampaignCreateData(data: CampaignInput): Prisma.CampaignCreateInput {
  const base = {
    slug: data.slug,
    title: data.title,
    description: data.description ?? null,
    isActive: data.isActive,
    showOnHomepage: data.showOnHomepage,
    startsAt: parseOptionalDate(data.startsAt),
    endsAt: parseOptionalDate(data.endsAt),
    bannerTitle: data.bannerTitle ?? null,
    bannerText: data.bannerText ?? null,
    bannerButtonText: data.bannerButtonText ?? null,
    bannerButtonHref: data.bannerButtonHref ?? null,
  };

  if (data.type === "PERCENT_DISCOUNT") {
    return {
      ...base,
      type: data.type,
      discountPercent: data.discountPercent,
      buyQuantity: null,
      payQuantity: null,
    };
  }

  if (data.type === "BUY_X_PAY_Y") {
    return {
      ...base,
      type: data.type,
      discountPercent: null,
      buyQuantity: data.buyQuantity,
      payQuantity: data.payQuantity,
    };
  }

  return {
    ...base,
    type: data.type,
    discountPercent: null,
    buyQuantity: 4,
    payQuantity: 2,
  };
}

function toCampaignUpdateData(data: CampaignUpdateInput): Prisma.CampaignUpdateInput {
  const update: Prisma.CampaignUpdateInput = {
    ...data,
    startsAt: data.startsAt === undefined ? undefined : parseOptionalDate(data.startsAt),
    endsAt: data.endsAt === undefined ? undefined : parseOptionalDate(data.endsAt),
  };

  if (data.type === "PERCENT_DISCOUNT") {
    update.discountPercent = data.discountPercent;
    update.buyQuantity = null;
    update.payQuantity = null;
  }

  if (data.type === "BUY_X_PAY_Y") {
    update.discountPercent = null;
    update.buyQuantity = data.buyQuantity;
    update.payQuantity = data.payQuantity;
  }

  if (data.type === "BUY_2_GET_2") {
    update.discountPercent = null;
    update.buyQuantity = 4;
    update.payQuantity = 2;
  }

  return update;
}

function parseOptionalDate(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

export default router;
