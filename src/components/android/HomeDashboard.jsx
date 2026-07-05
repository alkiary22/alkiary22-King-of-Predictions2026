import { Link } from "react-router-dom";
import { CalendarDays, Radio } from "lucide-react";

export default function HomeDashboard() {
  return (
    <section className="max-w-md mx-auto px-4 -mt-4 mb-3">
      <div className="grid grid-cols-2 gap-3">

        <Link
          to="/matches"
          className="inline-flex items-center gap-2 px-7 py-4 rounded-xl border border-gold/30 bg-black/30 backdrop-blur text-white font-bold hover:bg-gold/10 transition-colors"
        >
          <CalendarDays className="w-5 h-5 text-gold" />
          <span>المباريات</span>
        </Link>

        <Link
          to="/user-predictions"
          className="inline-flex items-center gap-2 px-7 py-4 rounded-xl border border-gold/30 bg-black/30 backdrop-blur text-white font-bold hover:bg-gold/10 transition-colors"
        >
          <Radio className="w-5 h-5 text-gold" />
          <span>التوقعات</span>
        </Link>

      </div>
    </section>
  );
}
