import { Crown, Sparkles } from "lucide-react";

const HERO_BG =
  "https://static.prod-images.emergentagent.com/jobs/36ca7cb1-56bf-4cbb-a9df-d07fc64af674/images/cf694e18d81a1e3b6118c5df05310e8b849aa4f259b4293ec8caeb6d2c40b94f.png";

export default function HeroSection({ user, t }) {
  return (
    <section className="relative overflow-hidden rounded-[34px] mb-6">

      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage: `url(${HERO_BG})`,
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-[#0A0A0A]" />

      <div className="relative px-6 py-10 text-center">

        <div className="mx-auto w-20 h-20 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-[0_0_45px_rgba(212,175,55,.35)]">

          <Crown
            className="text-black"
            size={42}
          />

        </div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2">

          <Sparkles
            size={16}
            className="text-[#D4AF37]"
          />

          <span className="text-xs tracking-[0.25em] text-[#D4AF37] font-bold">

            {t("landing_badge")}

          </span>

          <Sparkles
            size={16}
            className="text-[#D4AF37]"
          />

        </div>

        {user ? (

          <>

            <h1 className="mt-6 text-4xl font-black text-[#D4AF37]">

              {user.name}

            </h1>

            <p className="mt-3 text-zinc-300">

              جاهز لحصد المزيد من النقاط؟

            </p>

          </>

        ) : (

          <>

            <h1 className="mt-6 text-4xl font-black text-white">

              {t("landing_hero_line1")}

            </h1>

            <h2 className="mt-2 text-5xl font-black text-[#D4AF37]">

              {t("landing_hero_line2_strong")}

            </h2>

            <p className="mt-4 text-zinc-300">

              {t("landing_hero_desc")}

            </p>

          </>

        )}

      </div>

    </section>
  );
}
