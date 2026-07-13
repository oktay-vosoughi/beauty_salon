import { describe, expect, it } from "vitest";
import {
  calculateBuyTwoGetTwo,
  calculateBuyXPayY,
  calculatePercentageDiscount,
} from "../services/campaigns";

describe("calculateBuyTwoGetTwo", () => {
  it("charges the two most expensive units and gifts the two cheapest units in a group of four", () => {
    const result = calculateBuyTwoGetTwo([
      { productId: 1, unitPrice: 100, quantity: 1 },
      { productId: 2, unitPrice: 90, quantity: 1 },
      { productId: 3, unitPrice: 50, quantity: 1 },
      { productId: 4, unitPrice: 30, quantity: 1 },
    ]);

    expect(result.subtotal).toBe(270);
    expect(result.discountTotal).toBe(80);
    expect(result.total).toBe(190);
    expect(result.items).toEqual([
      { productId: 1, quantity: 1, freeQuantity: 0, discountAmount: 0 },
      { productId: 2, quantity: 1, freeQuantity: 0, discountAmount: 0 },
      { productId: 3, quantity: 1, freeQuantity: 1, discountAmount: 50 },
      { productId: 4, quantity: 1, freeQuantity: 1, discountAmount: 30 },
    ]);
  });

  it("applies the promotion only to complete groups of four units", () => {
    const result = calculateBuyTwoGetTwo([
      { productId: 1, unitPrice: 120, quantity: 1 },
      { productId: 2, unitPrice: 110, quantity: 1 },
      { productId: 3, unitPrice: 70, quantity: 1 },
      { productId: 4, unitPrice: 60, quantity: 1 },
      { productId: 5, unitPrice: 40, quantity: 1 },
      { productId: 6, unitPrice: 20, quantity: 1 },
    ]);

    expect(result.subtotal).toBe(420);
    expect(result.discountTotal).toBe(130);
    expect(result.total).toBe(290);
    expect(result.items.find((item) => item.productId === 3)?.freeQuantity).toBe(1);
    expect(result.items.find((item) => item.productId === 4)?.freeQuantity).toBe(1);
    expect(result.items.find((item) => item.productId === 5)?.freeQuantity).toBe(0);
    expect(result.items.find((item) => item.productId === 6)?.freeQuantity).toBe(0);
  });

  it("expands quantities before sorting units by price", () => {
    const result = calculateBuyTwoGetTwo([
      { productId: 1, unitPrice: 100, quantity: 2 },
      { productId: 2, unitPrice: 60, quantity: 1 },
      { productId: 3, unitPrice: 40, quantity: 1 },
    ]);

    expect(result.subtotal).toBe(300);
    expect(result.discountTotal).toBe(100);
    expect(result.total).toBe(200);
    expect(result.items).toEqual([
      { productId: 1, quantity: 2, freeQuantity: 0, discountAmount: 0 },
      { productId: 2, quantity: 1, freeQuantity: 1, discountAmount: 60 },
      { productId: 3, quantity: 1, freeQuantity: 1, discountAmount: 40 },
    ]);
  });
});

describe("calculatePercentageDiscount", () => {
  it("applies a percentage discount across all cart lines", () => {
    const result = calculatePercentageDiscount([
      { productId: 1, unitPrice: 100, quantity: 2 },
      { productId: 2, unitPrice: 50, quantity: 1 },
    ], 20);

    expect(result.subtotal).toBe(250);
    expect(result.discountTotal).toBe(50);
    expect(result.total).toBe(200);
    expect(result.items).toEqual([
      { productId: 1, quantity: 2, freeQuantity: 0, discountAmount: 40 },
      { productId: 2, quantity: 1, freeQuantity: 0, discountAmount: 10 },
    ]);
  });
});

describe("calculateBuyXPayY", () => {
  it("supports 3 al 1 ode by charging the most expensive item in each group of three", () => {
    const result = calculateBuyXPayY([
      { productId: 1, unitPrice: 100, quantity: 1 },
      { productId: 2, unitPrice: 70, quantity: 1 },
      { productId: 3, unitPrice: 40, quantity: 1 },
      { productId: 4, unitPrice: 20, quantity: 1 },
    ], { buyQuantity: 3, payQuantity: 1 });

    expect(result.subtotal).toBe(230);
    expect(result.discountTotal).toBe(110);
    expect(result.total).toBe(120);
    expect(result.items).toEqual([
      { productId: 1, quantity: 1, freeQuantity: 0, discountAmount: 0 },
      { productId: 2, quantity: 1, freeQuantity: 1, discountAmount: 70 },
      { productId: 3, quantity: 1, freeQuantity: 1, discountAmount: 40 },
      { productId: 4, quantity: 1, freeQuantity: 0, discountAmount: 0 },
    ]);
  });
});
