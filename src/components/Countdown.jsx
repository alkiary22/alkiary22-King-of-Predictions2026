import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { getServerNow } from "../lib/serverTime";

function diffParts(target) {
  const now = getServerNow();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { diff, days, hours, minutes, seconds };
}

export default function Countdown({ kickoff, compact = false }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(kickoff).getTime();
  if (!Number.isFinite(target)) return null;
  const { diff, days, hours, minutes, seconds } = diffParts(target);

  if (diff <= 0) {
    return (
      <div
        data-testid="countdown-live"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 ${
          compact ? "text-xs" : "text-sm"
        } font-bold`}
      >
        <span className="relative flex w-2 h-2">
          <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex w-2 h-2 rounded-full bg-red-500"></span>
        </span>
        بدأت المباراة
      </div>
    );
  }

  if (compact) {
    return (
      <span
        data-testid="countdown-compact"
        className="inline-flex items-center gap-1 text-xs text-zinc-400 font-medium"
      >
        <Clock className="w-3 h-3 text-gold" />
        {days > 0 && <span>{days}ي</span>}
        <span className="font-mono tabular-nums">
          {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </span>
    );
  }

  return (
    <div data-testid="countdown" className="flex items-center justify-center gap-2 text-center">
      <Slot value={days} label="يوم" />
      <Sep />
      <Slot value={hours} label="ساعة" />
      <Sep />
      <Slot value={minutes} label="دقيقة" />
      <Sep />
      <Slot value={seconds} label="ثانية" pulse />
    </div>
  );
}

function Slot({ value, label, pulse }) {
  return (
    <div className="flex flex-col items-center min-w-[44px]">
      <span
        className={`font-display font-black text-2xl text-gold tabular-nums ${
          pulse ? "animate-pulse" : ""
        }`}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] text-zinc-500 mt-0.5">{label}</span>
    </div>
  );
}

function Sep() {
  return <span className="text-gold/40 font-black text-xl">:</span>;
}
