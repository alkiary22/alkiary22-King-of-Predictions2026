import { Clock3 } from "lucide-react";

function Slot({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl font-black text-[#D4AF37] tabular-nums">
        {String(value).padStart(2, "0")}
      </span>

      <span className="text-xs text-zinc-500 mt-1">
        {label}
      </span>
    </div>
  );
}

export default function CountdownCard({ cd }) {
  if (!cd || cd.started) return null;

  return (
    <div className="rounded-3xl border border-[#D4AF37]/20 bg-[#121212]/90 backdrop-blur-xl p-6 shadow-[0_10px_40px_rgba(212,175,55,.15)]">

      <div className="flex items-center gap-2 mb-5">

        <Clock3 className="text-[#D4AF37]" size={22} />

        <span className="font-bold text-white">
          العد التنازلي لافتتاح كأس العالم
        </span>

      </div>

      <div className="flex justify-center gap-6">

        <Slot value={cd.days} label="يوم" />

        <Slot value={cd.hours} label="ساعة" />

        <Slot value={cd.minutes} label="دقيقة" />

      </div>

    </div>
  );
}
