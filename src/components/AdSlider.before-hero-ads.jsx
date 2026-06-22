import { useEffect, useState } from "react";

const ads = [
  {
    image: "/ads/ad1.jpg",
    title: "إعلان 1",
  },
  {
    image: "/ads/ad2.jpg",
    title: "إعلان 2",
  },
  {
    image: "/ads/ad3.jpg",
    title: "إعلان 3",
  },
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
    <div className="w-full my-6">
      <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-black shadow-[0_0_25px_rgba(255,215,0,0.12)]">
        <img
          src={ad.image}
          alt={ad.title}
          className="w-full h-44 sm:h-64 object-cover transition-all duration-700"
        />

        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-10 bg-gold" : "w-5 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
