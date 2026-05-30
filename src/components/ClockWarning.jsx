import { useState, useEffect } from "react";
import { useServerTime } from "../lib/serverTime";
import { AlertTriangle, X } from "lucide-react";

export default function ClockWarning() {
  const { ready, skewSec } = useServerTime();
  const [dismissed, setDismissed] = useState(false);

  // Show warning when device clock differs from server by > 2 minutes
  const absSkew = Math.abs(skewSec || 0);
  const shouldWarn = ready && absSkew > 120;

  useEffect(() => {
    setDismissed(false);
  }, [shouldWarn]);

  if (!shouldWarn || dismissed) return null;

  const minutes = Math.round(absSkew / 60);

  return (
    <div
      data-testid="clock-warning"
      className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300"
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 flex-1">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>تنبيه:</strong> وقت جهازك يختلف عن الوقت الفعلي بـ
            <strong className="mx-1 font-bold">{minutes} دقيقة</strong>.
            التطبيق يستخدم وقت السيرفر، لذا التوقعات تُغلق دائماً في الوقت الصحيح. يُنصح بتفعيل الوقت التلقائي في إعدادات الجهاز.
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          data-testid="dismiss-clock-warning"
          className="shrink-0 p-1 rounded hover:bg-amber-500/20"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
