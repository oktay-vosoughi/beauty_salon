import type { Campaign } from "@prisma/client";
import { prisma } from "../db/prisma";

export interface PromotionInputItem {
  productId: number;
  unitPrice: number;
  quantity: number;
}

export interface PromotionItemResult {
  productId: number;
  quantity: number;
  freeQuantity: number;
  discountAmount: number;
}

export interface PromotionResult {
  subtotal: number;
  discountTotal: number;
  total: number;
  items: PromotionItemResult[];
}

interface Unit {
  productId: number;
  unitPrice: number;
}

export function calculateBuyTwoGetTwo(items: PromotionInputItem[]): PromotionResult {
  return calculateBuyXPayY(items, { buyQuantity: 4, payQuantity: 2 });
}

export function calculateBuyXPayY(
  items: PromotionInputItem[],
  rule: { buyQuantity: number; payQuantity: number }
): PromotionResult {
  const normalized = items.map((item) => ({
    productId: item.productId,
    unitPrice: Number(item.unitPrice),
    quantity: item.quantity,
  }));
  const subtotal = normalized.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const units: Unit[] = normalized.flatMap((item) =>
    Array.from({ length: item.quantity }, () => ({
      productId: item.productId,
      unitPrice: item.unitPrice,
    }))
  );

  units.sort((a, b) => b.unitPrice - a.unitPrice);

  const freeByProduct = new Map<number, { quantity: number; discount: number }>();
  const buyQuantity = Math.max(1, Math.floor(rule.buyQuantity));
  const payQuantity = Math.max(0, Math.min(Math.floor(rule.payQuantity), buyQuantity));
  const completeGroups = Math.floor(units.length / buyQuantity);

  for (let groupIndex = 0; groupIndex < completeGroups; groupIndex += 1) {
    const group = units.slice(groupIndex * buyQuantity, groupIndex * buyQuantity + buyQuantity);
    for (const freeUnit of group.slice(payQuantity)) {
      const current = freeByProduct.get(freeUnit.productId) ?? { quantity: 0, discount: 0 };
      freeByProduct.set(freeUnit.productId, {
        quantity: current.quantity + 1,
        discount: current.discount + freeUnit.unitPrice,
      });
    }
  }

  const itemsResult = normalized.map((item) => {
    const free = freeByProduct.get(item.productId);
    return {
      productId: item.productId,
      quantity: item.quantity,
      freeQuantity: free?.quantity ?? 0,
      discountAmount: roundMoney(free?.discount ?? 0),
    };
  });
  const discountTotal = roundMoney(itemsResult.reduce((sum, item) => sum + item.discountAmount, 0));

  return {
    subtotal: roundMoney(subtotal),
    discountTotal,
    total: roundMoney(subtotal - discountTotal),
    items: itemsResult,
  };
}

export function calculatePercentageDiscount(items: PromotionInputItem[], discountPercent: number): PromotionResult {
  const percent = Math.max(0, Math.min(Number(discountPercent), 100));
  const normalized = items.map((item) => ({
    productId: item.productId,
    unitPrice: Number(item.unitPrice),
    quantity: item.quantity,
  }));
  const subtotal = roundMoney(normalized.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  const itemsResult = normalized.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    freeQuantity: 0,
    discountAmount: roundMoney(item.unitPrice * item.quantity * (percent / 100)),
  }));
  const discountTotal = roundMoney(itemsResult.reduce((sum, item) => sum + item.discountAmount, 0));

  return {
    subtotal,
    discountTotal,
    total: roundMoney(subtotal - discountTotal),
    items: itemsResult,
  };
}

export async function getActiveCampaign(now = new Date()): Promise<Campaign | null> {
  return prisma.campaign.findFirst({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function calculateCartPromotion(items: PromotionInputItem[]): Promise<{
  campaign: Campaign | null;
  promotion: PromotionResult;
}> {
  const campaign = await getActiveCampaign();
  if (!campaign) {
    const subtotal = roundMoney(items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0));
    return {
      campaign: null,
      promotion: {
        subtotal,
        discountTotal: 0,
        total: subtotal,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          freeQuantity: 0,
          discountAmount: 0,
        })),
      },
    };
  }

  if (campaign.type === "PERCENT_DISCOUNT") {
    return {
      campaign,
      promotion: calculatePercentageDiscount(items, Number(campaign.discountPercent ?? 0)),
    };
  }

  if (campaign.type === "BUY_X_PAY_Y") {
    return {
      campaign,
      promotion: calculateBuyXPayY(items, {
        buyQuantity: campaign.buyQuantity ?? 0,
        payQuantity: campaign.payQuantity ?? 0,
      }),
    };
  }

  return {
    campaign,
    promotion: calculateBuyXPayY(items, {
      buyQuantity: campaign.buyQuantity ?? 4,
      payQuantity: campaign.payQuantity ?? 2,
    }),
  };
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
