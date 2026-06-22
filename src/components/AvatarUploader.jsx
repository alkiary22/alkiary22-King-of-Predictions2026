import { useRef, useState } from "react";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api, { apiErrorMessage } from "../lib/api";
import Avatar from "./Avatar";

/** Resize an image File to 256x256 JPEG dataURL (~30-50KB). */
async function resizeImage(file, maxSize = 256, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AvatarUploader({ user, onUpdated }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("الملف ليس صورة");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("الصورة كبيرة جداً (أكثر من 8 ميجابايت)");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await resizeImage(file);
      await api.post("/users/me/avatar", { avatar: dataUrl });
      toast.success("تم تحديث صورتك الشخصية");
      onUpdated?.();
    } catch (e2) {
      toast.error(apiErrorMessage(e2));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onRemove = async () => {
    if (!window.confirm("هل أنت متأكد من حذف صورتك الشخصية؟")) return;
    setBusy(true);
    try {
      await api.delete("/users/me/avatar");
      toast.success("تم حذف الصورة");
      onUpdated?.();
    } catch (e2) {
      toast.error(apiErrorMessage(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative inline-block" data-testid="avatar-uploader">
      <Avatar src={user?.avatar} name={user?.name} size={80} testId="profile-avatar" />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        data-testid="avatar-upload-btn"
        title="تحديث الصورة"
        className="absolute -bottom-1 -left-1 w-9 h-9 rounded-full bg-gold text-black flex items-center justify-center shadow-lg hover:bg-yellow-400 active:scale-95 transition disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
      </button>
      {user?.avatar && (
        <button
          onClick={onRemove}
          disabled={busy}
          data-testid="avatar-remove-btn"
          title="حذف الصورة"
          className="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-lg hover:bg-red-500 active:scale-95 transition disabled:opacity-60"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
        data-testid="avatar-file-input"
      />
    </div>
  );
}
