import { describe, it, expect } from "vitest";
import { buildPayTRHash, verifyPayTRCallback } from "../services/paytr";

const MERCHANT_KEY = "test-merchant-key";
const MERCHANT_SALT = "test-merchant-salt";
const MERCHANT_ID = "123456";

describe("buildPayTRHash", () => {
  it("produces a base64 HMAC-SHA256 string", () => {
    const hash = buildPayTRHash({
      merchantId: MERCHANT_ID,
      merchantKey: MERCHANT_KEY,
      merchantSalt: MERCHANT_SALT,
      merchantOid: "abc123",
      email: "test@example.com",
      paymentAmount: 9990,
      userBasketStr: "W10=",
      noInstallment: 0,
      maxInstallment: 0,
      currency: "TL",
      testMode: "1",
    });
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(20);
    // base64 chars only
    expect(hash).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it("is deterministic for same inputs", () => {
    const params = {
      merchantId: MERCHANT_ID,
      merchantKey: MERCHANT_KEY,
      merchantSalt: MERCHANT_SALT,
      merchantOid: "order-001",
      email: "user@example.com",
      paymentAmount: 15000,
      userBasketStr: "W1siVXLDvG4iLCIxMDAwMCIsIDFdXQ==",
      noInstallment: 1,
      maxInstallment: 0,
      currency: "TL",
      testMode: "1",
    };
    expect(buildPayTRHash(params)).toBe(buildPayTRHash(params));
  });

  it("changes when paymentAmount changes", () => {
    const base = {
      merchantId: MERCHANT_ID,
      merchantKey: MERCHANT_KEY,
      merchantSalt: MERCHANT_SALT,
      merchantOid: "oid-1",
      email: "a@b.com",
      userBasketStr: "W10=",
      noInstallment: 0,
      maxInstallment: 0,
      currency: "TL",
      testMode: "1",
    };
    const h1 = buildPayTRHash({ ...base, paymentAmount: 5000 });
    const h2 = buildPayTRHash({ ...base, paymentAmount: 9999 });
    expect(h1).not.toBe(h2);
  });
});

describe("verifyPayTRCallback", () => {
  function makeHash(oid: string, status: string, amount: string) {
    const { createHmac } = require("crypto");
    const str = [MERCHANT_KEY, oid, amount, status, MERCHANT_SALT].join("");
    return createHmac("sha256", MERCHANT_KEY).update(str).digest("base64");
  }

  it("returns true for a valid callback", () => {
    const oid = "abc123";
    const status = "success";
    const amount = "9990";
    const hash = makeHash(oid, status, amount);
    expect(
      verifyPayTRCallback(
        { merchant_oid: oid, status, total_amount: amount, hash },
        MERCHANT_KEY,
        MERCHANT_SALT
      )
    ).toBe(true);
  });

  it("returns false when hash is wrong", () => {
    expect(
      verifyPayTRCallback(
        { merchant_oid: "x", status: "success", total_amount: "1000", hash: "BADHASH" },
        MERCHANT_KEY,
        MERCHANT_SALT
      )
    ).toBe(false);
  });

  it("returns false when required fields are missing", () => {
    expect(
      verifyPayTRCallback(
        { merchant_oid: "x", status: "success" },
        MERCHANT_KEY,
        MERCHANT_SALT
      )
    ).toBe(false);
  });
});
