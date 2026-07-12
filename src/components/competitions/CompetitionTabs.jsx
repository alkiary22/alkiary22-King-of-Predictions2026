const tabs = [
  { id: "matches", title: "المباريات" },
  { id: "standings", title: "الترتيب" },
  { id: "teams", title: "الفرق" },
  { id: "scorers", title: "الهدافون" },
];

export default function CompetitionTabs({
  active,
  onChange,
}) {
  return (
    <div
      dir="rtl"
      className="grid grid-cols-4 gap-2 w-full"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={
            active === tab.id
              ? "min-w-0 px-1 py-3 rounded-2xl bg-[#D4AF37] text-black text-sm sm:text-base font-black whitespace-nowrap"
              : "min-w-0 px-1 py-3 rounded-2xl bg-[#191919] border border-white/10 text-white text-sm sm:text-base font-bold whitespace-nowrap"
          }
        >
          {tab.title}
        </button>
      ))}
    </div>
  );
}
