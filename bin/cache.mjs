// bin/cache.mjs
const FALLBACK_TTL = 300; // seconds

class InMemoryBackend {
  constructor() {
    this._store = new Map();
  }

  async get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (Date.now() >= entry.expiry) {
      this._store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value, ttl = FALLBACK_TTL) {
    this._store.set(key, { value, expiry: Date.now() + ttl * 1000 });
  }

  async invalidate(pattern) {
    const regex = new RegExp(pattern);
    for (const k of this._store.keys()) {
      if (regex.test(k)) this._store.delete(k);
    }
  }

  async close() {}
}

class RedisBackend {
  constructor(redis) {
    this._redis = redis;
  }

  async get(key) {
    const raw = await this._redis.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async set(key, value, ttl = FALLBACK_TTL) {
    await this._redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async invalidate(pattern) {
    // pattern uses glob syntax for Redis SCAN
    const globPattern = pattern.replace(/\.\*/g, '*').replace(/\[^/g, '[^');
    const safeGlob = globPattern.endsWith('*') ? globPattern : globPattern + '*';
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this._redis.scan(cursor, 'MATCH', safeGlob, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) await this._redis.del(...keys);
    } while (cursor !== '0');
  }

  async close() {
    await this._redis.quit();
  }
}

async function createBackend(redisUrl) {
  if (!redisUrl) return new InMemoryBackend();

  try {
    const { default: Redis } = await import('ioredis');
    const redis = new Redis(redisUrl, { lazyConnect: true, connectTimeout: 3000 });
    await redis.connect();
    return new RedisBackend(redis);
  } catch {
    return new InMemoryBackend();
  }
}

export class SkillCache {
  constructor() {
    this._backend = null;
    this._initPromise = null;
  }

  _init() {
    if (!this._initPromise) {
      this._initPromise = createBackend(process.env.REDIS_URL).then((b) => {
        this._backend = b;
      });
    }
    return this._initPromise;
  }

  async get(key) {
    await this._init();
    return this._backend.get(key);
  }

  async set(key, value, ttl) {
    await this._init();
    return this._backend.set(key, value, ttl);
  }

  async invalidate(pattern = 'wus:') {
    await this._init();
    return this._backend.invalidate(pattern);
  }

  async close() {
    if (this._backend) await this._backend.close();
  }
}

export const skillCache = new SkillCache();
