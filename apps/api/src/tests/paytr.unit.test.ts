import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { buildPayTRHash, verifyPayTRCallback } from "../services/paytr";

const MERCHANT_KEY = "test-merchant-key";
const MERCHANT_SALT = "test-merchant-salt";
const MERCHANT_ID = "123456";
const USER_IP = "85.34.78.112";

// Independent re-implementation of the OFFICIAL PayTR iFrame token hash:
// merchant_id + user_ip + merchant_oid + email + payment_amount +
// user_basket + no_installment + max_installment + currency + test_mode + merchant_salt
function expectedTokenHash(p: {
  merchantId: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmount: number;
  userBasketStr: string;
  noInstallment: number;
  maxInstallment: number;
  currency: string;
  testMode: string;
}): string {
  const str = [
    p.merchantId, p.userIp, p.merchantOid, p.email, p.paymentAmount,
    p.userBasketStr, p.noInstallment, p.maxInstallment, p.currency, p.testMode,
    MERCHANT_SALT,
  ].join("");
  return createHmac("sha256", MERCHANT_KEY).update(str).digest("base64");
}

describe("buildPayTRHash", () => {
  it("matches the official PayTR iFrame hash formula (includes user_ip and merchant_oid)", () => {
    const args = {
      merchantId: MERCHANT_ID,
      userIp: USER_IP,
      merchantOid: "abc123",
      email: "test@example.com",
      paymentAmount: 9990,
      userBasketStr: "W10=",
      noInstallment: 0,
      maxInstallment: 0,
      currency: "TL",
      testMode: "1",
    };
    const hash = buildPayTRHash({
      ...args,
      merchantKey: MERCHANT_KEY,
      merchantSalt: MERCHANT_SALT,
    });
    expect(hash).toBe(expectedTokenHash(args));
    expect(hash).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it("changes when user_ip changes (proves user_ip is in the hash)", () => {
    const base = {
      merchantId: MERCHANT_ID,
      merchantKey: MERCHANT_KEY,
      merchantSalt: MERCHANT_SALT,
      merchantOid: "oid-1",
      email: "a@b.com",
      paymentAmount: 5000,
      userBasketStr: "W10=",
      noInstallment: 0,
      maxInstallment: 0,
      currency: "TL",
      testMode: "1",
    };
    expect(buildPayTRHash({ ...base, userIp: "1.1.1.1" }))
      .not.toBe(buildPayTRHash({ ...base, userIp: "2.2.2.2" }));
  });

  it("changes when merchant_oid changes (proves merchant_oid is in the hash)", () => {
    const base = {
      merchantId: MERCHANT_ID,
      merchantKey: MERCHANT_KEY,
      merchantSalt: MERCHANT_SALT,
      userIp: USER_IP,
      email: "a@b.com",
      paymentAmount: 5000,
      userBasketStr: "W10=",
      noInstallment: 0,
      maxInstallment: 0,
      currency: "TL",
      testMode: "1",
    };
    expect(buildPayTRHash({ ...base, merchantOid: "oid-1" }))
      .not.toBe(buildPayTRHash({ ...base, merchantOid: "oid-2" }));
  });
});

describe("verifyPayTRCallback", () => {
  // Official PayTR callback hash: merchant_oid + merchant_salt + status + total_amount
  function makeHash(oid: string, status: string, amount: string) {
    const str = [oid, MERCHANT_SALT, status, amount].join("");
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
