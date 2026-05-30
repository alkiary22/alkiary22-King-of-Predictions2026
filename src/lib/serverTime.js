/**
 * Server-time sync: protects against client clock tampering.
 * The backend exposes GET /api/time. We measure the offset
 * between server and client clocks at app start and refresh
 * periodically. All countdown / lock decisions on the frontend
 * use `getServerNow()` instead of `Date.now()`.
 */
import { useEffect, useState, useCallback } from "react";
import api from "./api";

let offsetMs = 0; // server - client
let initialized = false;

export async function syncServerTime() {
  const t0 = Date.now();
  try {
    const { data } = await api.get("/time");
    const t1 = Date.now();
    const serverNow = new Date(data.now).getTime();
    const rtt = t1 - t0;
    // Compensate for one-way latency (half of round-trip)
    offsetMs = serverNow - (t0 + rtt / 2);
    initialized = true;
  } catch (e) {
    // network failure — keep last known offset
  }
  return offsetMs;
}

export function getServerNow() {
  return Date.now() + offsetMs;
}

export function isServerTimeReady() {
  return initialized;
}

export function getOffsetMs() {
  return offsetMs;
}

export function useServerTime() {
  const [ready, setReady] = useState(initialized);
  const [skewSec, setSkewSec] = useState(Math.round(offsetMs / 1000));

  const refresh = useCallback(async () => {
    await syncServerTime();
    setReady(true);
    setSkewSec(Math.round(offsetMs / 1000));
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5 * 60 * 1000); // every 5 min
    return () => clearInterval(id);
  }, [refresh]);

  return { ready, skewSec, refresh, getServerNow };
}
