import { useEffect, useState } from "react";
import api, { apiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Images, Save, Trash2, UploadCloud } from "lucide-react";

const MAX_IMAGES = 8;
const TARGET_WIDTH = 1400;
const JPEG_QUALITY = 0.82;

export default function AdminAds() {
  const [images, setImages] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
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
      const list = Array.isArray(data?.images) ? data.images : [];
      setImages(list);
      setSelectedIndex(0);
    } catch {
      toast.error("تعذر تحميل صور السلايدر");
    } finally {
      setLoading(false);
    }
  }

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

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
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
        newImages.push(await compressImage(file));
      }

      setImages((prev) => {
        const next = [...prev, ...newImages].slice(0, MAX_IMAGES);
        setSelectedIndex(Math.max(0, next.length - newImages.length));
        return next;
      });

      toast.success(`تم تجهيز ${newImages.length} صورة`);
    } catch (err) {
      toast.error(err.message || "تعذر تجهيز الصورة");
    } finally {
      setProcessing(false);
      e.target.value = "";
    }
  }

  function removeImage(index) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setSelectedIndex((old) => Math.min(old, Math.max(0, next.length - 1)));
      return next;
    });
  }

  function moveImage(index, dir) {
    setImages((prev) => {
      const arr = [...prev];
      const next = index + dir;
      if (next < 0 || next >= arr.length) return arr;
      [arr[index], arr[next]] = [arr[next], arr[index]];
      setSelectedIndex(next);
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

  const selectedImage = images[selectedIndex];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10" data-testid="admin-ads-page">
      <div className="mb-5">
        <h1 className="font-display text-3xl sm:text-4xl font-black mb-2 flex items-center gap-2">
          <Images className="w-7 h-7 text-gold" />
          إدارة سلايدر الصور
        </h1>
        <p className="text-zinc-400 text-sm">
          ارفع صور السلايدر، رتّبها، ثم اضغط حفظ لتظهر عند كل المستخدمين.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-4 sm:p-5 mb-5 border border-white/10 sticky top-[72px] z-30">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <div className="font-bold">
              الصور الحالية: <span className="text-gold">{images.length}</span> / {MAX_IMAGES}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              يتم ضغط الصور تلقائيًا قبل الحفظ.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/15">
              <UploadCloud className="w-4 h-4" />
              {processing ? "جاري التجهيز..." : "رفع صور"}
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
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gold text-black font-black disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? "جاري الحفظ..." : "حفظ السلايدر"}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-card rounded-2xl p-10 text-center text-zinc-400">
          جاري تحميل الصور...
        </div>
      ) : images.length === 0 ? (
        <div className="glass-card rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-zinc-400">
          لا توجد صور في السلايدر حالياً.
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-5">
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10">
            <h2 className="font-black mb-4">الصور</h2>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`rounded-2xl overflow-hidden border bg-white/5 ${
                    selectedIndex === index ? "border-gold/60" : "border-white/10"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className="block w-full"
                  >
                    <img
                      src={img}
                      alt={`Ad ${index + 1}`}
                      className="w-full h-40 object-cover"
                    />
                  </button>

                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-sm font-bold text-zinc-300">صورة {index + 1}</span>
                      {selectedIndex === index && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-gold/15 text-gold font-bold">
                          محددة
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => moveImage(index, -1)}
                        disabled={index === 0}
                        className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-white/10 text-white text-xs disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                        فوق
                      </button>

                      <button
                        onClick={() => moveImage(index, 1)}
                        disabled={index === images.length - 1}
                        className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-white/10 text-white text-xs disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                        تحت
                      </button>

                      <button
                        onClick={() => removeImage(index)}
                        className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-red-500/20 text-red-300 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 h-fit lg:sticky lg:top-36">
            <h2 className="font-black mb-4">معاينة السلايدر</h2>

            {selectedImage ? (
              <div>
                <div className="rounded-2xl overflow-hidden bg-white border border-white/10 shadow-xl">
                  <img
                    src={selectedImage}
                    alt="preview"
                    className="w-full h-44 object-cover"
                  />
                </div>

                <div className="mt-4 text-sm text-zinc-300">
                  الصورة المحددة: <span className="text-gold font-black">{selectedIndex + 1}</span>
                </div>

                <p className="text-xs text-zinc-500 mt-2">
                  هذه معاينة تقريبية لشكل الصورة داخل سلايدر التطبيق.
                </p>
              </div>
            ) : (
              <div className="text-zinc-500 text-sm">اختر صورة للمعاينة</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
