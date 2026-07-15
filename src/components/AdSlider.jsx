import { useEffect, useState } from "react";
import api from "../lib/api";

export default function AdSlider() {
  const [ads, setAds] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    async function loadAds() {
      try {
        const { data } = await api.get("/ads-slider");

        if (Array.isArray(data.images) && data.images.length) {
          setAds(
            data.images.map((img, i) => ({
              image: img,
              title: `إعلان ${i + 1}`,
            }))
          );
        }
      } catch (e) {
        console.error(e);
      }
    }

    loadAds();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % ads.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [ads]);

  if (!ads.length) return null;

  const ad = ads[index];

  return (
    <div className="w-full max-w-[690px] mx-auto mb-4 animate-fade-in-up">
      <div className="relative overflow-hidden rounded-[30px] bg-white shadow-2xl border border-white/10">
        <img
          src={ad.image}
          alt={ad.title}
          className="w-full h-auto block object-contain"
        />

        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-9 bg-gold" : "w-4 bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
