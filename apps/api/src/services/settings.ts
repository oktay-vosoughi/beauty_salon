import { prisma } from "../db/prisma";
import { encrypt, decrypt } from "../utils/encryption";

const ENCRYPTED_KEYS = new Set(["paytr_merchant_key", "paytr_merchant_salt"]);

interface CacheEntry { value: string; expiresAt: number }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getSetting(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const row = await prisma.siteSetting.findUnique({ where: { key } });
  if (!row) return null;

  const value = ENCRYPTED_KEYS.has(key) ? decrypt(row.value) : row.value;
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

async function setSetting(key: string, value: string): Promise<void> {
  const stored = ENCRYPTED_KEYS.has(key) ? encrypt(value) : value;
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: stored },
    update: { value: stored },
  });
  cache.delete(key);
}

export async function getPayTRCredentials() {
  const [merchantId, merchantKey, merchantSalt, testMode] = await Promise.all([
    getSetting("paytr_merchant_id"),
    getSetting("paytr_merchant_key"),
    getSetting("paytr_merchant_salt"),
    getSetting("paytr_test_mode"),
  ]);
  return {
    merchantId: merchantId ?? process.env.PAYTR_MERCHANT_ID ?? "",
    merchantKey: merchantKey ?? process.env.PAYTR_MERCHANT_KEY ?? "",
    merchantSalt: merchantSalt ?? process.env.PAYTR_MERCHANT_SALT ?? "",
    testMode: testMode ?? process.env.PAYTR_TEST_MODE ?? "1",
  };
}

export async function setPayTRCredentials(updates: {
  merchantId?: string;
  merchantKey?: string;
  merchantSalt?: string;
  testMode?: string;
}): Promise<void> {
  const ops: Promise<void>[] = [];
  if (updates.merchantId !== undefined && updates.merchantId !== "")
    ops.push(setSetting("paytr_merchant_id", updates.merchantId));
  if (updates.merchantKey !== undefined && updates.merchantKey !== "")
    ops.push(setSetting("paytr_merchant_key", updates.merchantKey));
  if (updates.merchantSalt !== undefined && updates.merchantSalt !== "")
    ops.push(setSetting("paytr_merchant_salt", updates.merchantSalt));
  if (updates.testMode !== undefined)
    ops.push(setSetting("paytr_test_mode", updates.testMode));
  await Promise.all(ops);
}

export async function getPayTRStatus() {
  const [merchantId, merchantKey, merchantSalt, testMode] = await Promise.all([
    getSetting("paytr_merchant_id"),
    getSetting("paytr_merchant_key"),
    getSetting("paytr_merchant_salt"),
    getSetting("paytr_test_mode"),
  ]);
  return {
    merchantId: merchantId ?? process.env.PAYTR_MERCHANT_ID ?? "",
    hasMerchantKey: !!(merchantKey ?? process.env.PAYTR_MERCHANT_KEY),
    hasMerchantSalt: !!(merchantSalt ?? process.env.PAYTR_MERCHANT_SALT),
    testMode: testMode ?? process.env.PAYTR_TEST_MODE ?? "1",
  };
}
