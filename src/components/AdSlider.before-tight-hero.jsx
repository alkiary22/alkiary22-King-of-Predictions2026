import { useEffect, useState } from "react";

const ads = [
  { image: "/ads/ad1.jpg", title: "إعلان 1" },
  { image: "/ads/ad2.jpg", title: "إعلان 2" },
  { image: "/ads/ad3.jpg", title: "إعلان 3" },
];

export default function AdSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % ads.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const ad = ads[index];

  return (
    <div className="w-full max-w-[690px] mx-auto mb-8 animate-fade-in-up">
      <div className="relative overflow-hidden rounded-[30px] bg-white shadow-2xl border border-white/10">
        <img
          src={ad.image}
          alt={ad.title}
          className="w-full h-[150px] sm:h-[185px] object-cover"
        />

        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-9 bg-gold" : "w-4 bg-white/70"
              }`}
              aria-label={`إعلان ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
