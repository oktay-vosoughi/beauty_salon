import Redis from "ioredis";

// --- In-memory fallback (used when Redis is unavailable) ---
interface MemEntry { value: string; expiresAt: number }
const _mem = new Map<string, MemEntry>();
const MEM_MAX = 1000;

function memGet(key: string): string | null {
  const e = _mem.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) { _mem.delete(key); return null; }
  return e.value;
}

function memSet(key: string, value: string, ttl: number): void {
  if (_mem.size >= MEM_MAX) {
    const oldest = _mem.keys().next().value;
    if (oldest) _mem.delete(oldest);
  }
  _mem.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
}

function memDel(pattern: string): void {
  const prefix = pattern.replace(/\*$/, "");
  for (const key of _mem.keys()) {
    if (key.startsWith(prefix)) _mem.delete(key);
  }
}

// --- Redis (optional, preferred when REDIS_HOST is set) ---
let _client: Redis | null = null;
let _connecting = false;

function getRedis(): Redis | null {
  if (_client) return _client;
  if (_connecting) return null;
  const host = process.env.REDIS_HOST;
  if (!host) return null;

  _connecting = true;
  const client = new Redis({
    host,
    port: Number(process.env.REDIS_PORT) || 6379,
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
  });

  client.on("error", () => { _client = null; _connecting = false; });
  client.on("ready", () => { _connecting = false; });
  _client = client;
  return client;
}

export async function cacheGet(key: string): Promise<string | null> {
  try {
    const r = getRedis();
    if (r) return await r.get(key);
  } catch { /* fall through */ }
  return memGet(key);
}

export async function cacheSet(key: string, value: string, ttl = 60): Promise<void> {
  memSet(key, value, ttl);
  try {
    const r = getRedis();
    if (r) await r.set(key, value, "EX", ttl);
  } catch { /* mem already set */ }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  memDel(pattern);
  try {
    const r = getRedis();
    if (!r) return;
    const keys = await r.keys(pattern);
    if (keys.length) await r.del(...keys);
  } catch { /* swallow */ }
}
