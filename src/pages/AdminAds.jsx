import { useEffect, useState } from "react";
import api, { apiErrorMessage } from "@/lib/api";
import { toast } from "sonner";

const MAX_IMAGES = 8;

// إعدادات الضغط
const TARGET_WIDTH = 1400;     // عرض مناسب للسلايدر
const JPEG_QUALITY = 0.82;     // جودة جيدة مع حجم خفيف

export default function AdminAds() {
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadAds();
  }, []);

  async function loadAds() {
    setLoading(true);
    try {
      const { data } = await api.get("/ads-slider");
      setImages(Array.isArray(data?.images) ? data.images : []);
    } catch (e) {
      toast.error("تعذر تحميل صور السلايدر");
    } finally {
      setLoading(false);
    }
  }

  // ضغط الصورة وتحويلها إلى JPEG Base64
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("الملف ليس صورة"));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          try {
            const scale = Math.min(1, TARGET_WIDTH / img.width);
            const width = Math.round(img.width * scale);
            const height = Math.round(img.height * scale);

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("تعذر تجهيز الصورة"));
              return;
            }

            // خلفية بيضاء لو كانت PNG شفافة
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

            // تنبيه اختياري إذا بقيت الصورة كبيرة جدًا
            const approxBytes = Math.ceil((dataUrl.length * 3) / 4);
            if (approxBytes > 900000) {
              // لا نمنعها، فقط نحاول إبلاغ المستخدم إن كانت كبيرة
              console.warn("Compressed image is still relatively large:", approxBytes);
            }

            resolve(dataUrl);
          } catch {
            reject(new Error("فشل ضغط الصورة"));
          }
        };
        img.onerror = () => reject(new Error("تعذر قراءة الصورة"));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error("تعذر قراءة الملف"));
      reader.readAsDataURL(file);
    });
  }

  async function handleAddImages(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = Math.max(0, MAX_IMAGES - images.length);
    if (remaining <= 0) {
      toast.error(`الحد الأقصى ${MAX_IMAGES} صور`);
      e.target.value = "";
      return;
    }

    const selected = files.slice(0, remaining);

    setProcessing(true);
    try {
      const newImages = [];
      for (const file of selected) {
        const compressed = await compressImage(file);
        newImages.push(compressed);
      }

      setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
      toast.success(`تم تجهيز ${newImages.length} صورة للسلايدر`);
    } catch (err) {
      toast.error(err.message || "تعذر تجهيز الصورة");
    } finally {
      setProcessing(false);
      e.target.value = "";
    }
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function moveImage(index, dir) {
    setImages((prev) => {
      const arr = [...prev];
      const next = index + dir;
      if (next < 0 || next >= arr.length) return arr;
      [arr[index], arr[next]] = [arr[next], arr[index]];
      return arr;
    });
  }

  async function saveAds() {
    setSaving(true);
    try {
      await api.put("/admin/ads-slider", { images });
      toast.success("تم حفظ صور السلايدر بنجاح");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" data-testid="admin-ads-page">
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl sm:text-4xl font-black mb-2">إدارة سلايدر الصور</h1>
          <p className="text-zinc-400 text-sm">
            ارفع صور السلايدر، غيّر ترتيبها، ثم اضغط حفظ لتظهر عند كل المستخدمين.
          </p>
          <p className="text-zinc-500 text-xs mt-2">
            الحد الأقصى: {MAX_IMAGES} صور — يتم الآن ضغط الصور تلقائيًا قبل الحفظ.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <label className="cursor-pointer inline-flex items-center justify-center px-4 py-3 rounded-xl bg-gold text-black font-black">
            {processing ? "جاري تجهيز الصور..." : "رفع صور"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleAddImages}
              disabled={processing || saving}
            />
          </label>

          <button
            onClick={saveAds}
            disabled={saving || processing}
            className="px-4 py-3 rounded-xl bg-emerald-600 text-white font-black disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : "حفظ السلايدر"}
          </button>
        </div>

        {loading ? (
          <div className="text-zinc-400">جاري تحميل الصور...</div>
        ) : images.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-zinc-400">
            لا توجد صور في السلايدر حالياً.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img, index) => (
              <div key={index} className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                <img
                  src={img}
                  alt={`Ad ${index + 1}`}
                  className="w-full h-40 object-cover"
                />

                <div className="p-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-zinc-300">صورة {index + 1}</span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => moveImage(index, -1)}
                      className="px-2 py-1 rounded-lg bg-white/10 text-white text-xs"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveImage(index, 1)}
                      className="px-2 py-1 rounded-lg bg-white/10 text-white text-xs"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeImage(index)}
                      className="px-2 py-1 rounded-lg bg-red-500/20 text-red-300 text-xs"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && images.length > 0 && (
          <div className="mt-6 text-xs text-zinc-500">
            عدد الصور الحالية: {images.length} / {MAX_IMAGES}
          </div>
        )}
      </div>
    </div>
  );
}
