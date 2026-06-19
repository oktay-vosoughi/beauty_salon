import { createHmac, timingSafeEqual } from "crypto";

const PAYTR_API_URL = "https://www.paytr.com/odeme/api/get-token";

export interface PayTRTokenParams {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  merchantOid: string;
  email: string;
  paymentAmount: number; // in kuruş (cents)
  currency: string;
  noInstallment: number;
  maxInstallment: number;
  userName: string;
  userAddress: string;
  userPhone: string;
  userBasket: Array<[string, string, number]>; // [name, price_str, quantity]
  userIp: string;
  testMode: string;
  debugOn: string;
  okUrl: string;
  failUrl: string;
  timeoutLimit: string;
}

export function buildPayTRHash(params: {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  merchantOid: string;
  email: string;
  paymentAmount: number;
  userBasketStr: string;
  noInstallment: number;
  maxInstallment: number;
  currency: string;
  testMode: string;
}): string {
  const {
    merchantId, merchantKey, merchantSalt,
    merchantOid, email, paymentAmount,
    userBasketStr, noInstallment, maxInstallment,
    currency, testMode,
  } = params;

  const hashStr = [
    merchantId,
    params.email,
    paymentAmount,
    userBasketStr,
    noInstallment,
    maxInstallment,
    currency,
    testMode,
    merchantSalt,
  ].join("");

  return createHmac("sha256", merchantKey)
    .update(hashStr)
    .digest("base64");
}

export async function getPayTRToken(params: PayTRTokenParams): Promise<string> {
  const userBasketStr = Buffer.from(
    JSON.stringify(params.userBasket)
  ).toString("base64");

  const paytrToken = buildPayTRHash({
    merchantId: params.merchantId,
    merchantKey: params.merchantKey,
    merchantSalt: params.merchantSalt,
    merchantOid: params.merchantOid,
    email: params.email,
    paymentAmount: params.paymentAmount,
    userBasketStr,
    noInstallment: params.noInstallment,
    maxInstallment: params.maxInstallment,
    currency: params.currency,
    testMode: params.testMode,
  });

  const body = new URLSearchParams({
    merchant_id: params.merchantId,
    user_ip: params.userIp,
    merchant_oid: params.merchantOid,
    email: params.email,
    payment_amount: String(params.paymentAmount),
    paytr_token: paytrToken,
    user_basket: userBasketStr,
    debug_on: params.debugOn,
    no_installment: String(params.noInstallment),
    max_installment: String(params.maxInstallment),
    user_name: params.userName,
    user_address: params.userAddress,
    user_phone: params.userPhone,
    merchant_ok_url: params.okUrl,
    merchant_fail_url: params.failUrl,
    timeout_limit: params.timeoutLimit,
    currency: params.currency,
    test_mode: params.testMode,
  });

  const res = await fetch(PAYTR_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const rawText = await res.text();
  console.log("[PayTR] HTTP status:", res.status, "body:", rawText.slice(0, 500));
  let data: { status: string; token?: string; reason?: string };
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`PayTR non-JSON response (HTTP ${res.status}): ${rawText.slice(0, 200)}`);
  }

  if (data.status !== "success" || !data.token) {
    throw new Error(`PayTR token error: ${data.reason ?? "unknown"}`);
  }

  return data.token;
}

export function verifyPayTRCallback(
  params: Record<string, string>,
  merchantKey: string,
  merchantSalt: string
): boolean {
  const { merchant_oid, status, total_amount, hash } = params;
  if (!merchant_oid || !status || !total_amount || !hash) return false;

  const hashStr = [merchantKey, merchant_oid, total_amount, status, merchantSalt].join("");
  const expected = createHmac("sha256", merchantKey)
    .update(hashStr)
    .digest("base64");

  try {
    const expectedBuf = Buffer.from(expected, "base64");
    const hashBuf = Buffer.from(hash, "base64");
    if (expectedBuf.length !== hashBuf.length) return false;
    return timingSafeEqual(expectedBuf, hashBuf);
  } catch {
    return false;
  }
}
