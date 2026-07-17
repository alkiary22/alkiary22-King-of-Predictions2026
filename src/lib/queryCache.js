const cache = new Map();
const pending = new Map();

const DEFAULT_TTL = 60000;

export async function cachedRequest(key, fetcher, ttl = DEFAULT_TTL) {
  const now = Date.now();

  const old = cache.get(key);

  if (old && now - old.time < ttl) {
    return old.data;
  }

  if (pending.has(key)) {
    return pending.get(key);
  }

  const promise = (async () => {
    try {
      const data = await fetcher();

      cache.set(key, {
        data,
        time: Date.now(),
      });

      return data;
    } finally {
      pending.delete(key);
    }
  })();

  pending.set(key, promise);

  return promise;
}

export function getCached(key) {
  return cache.get(key)?.data;
}

export function setCached(key, value) {
  cache.set(key, {
    data: value,
    time: Date.now(),
  });
}

export function invalidate(prefix = "") {
  [...cache.keys()].forEach((k) => {
    if (k.startsWith(prefix)) {
      cache.delete(k);
    }
  });
}

export async function prefetch(key, fetcher, ttl = DEFAULT_TTL) {
  if (cache.has(key)) return;

  try {
    await cachedRequest(key, fetcher, ttl);
  } catch {}
}
