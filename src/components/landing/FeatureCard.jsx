export default function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="glass-card rounded-2xl p-7 hover:-translate-y-1 hover:border-gold/30 transition-all">
      <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center mb-5">
        <Icon className="w-6 h-6 text-gold" />
      </div>

      <h3 className="font-display text-xl font-bold mb-2">
        {title}
      </h3>

      <p className="text-sm text-zinc-400 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
