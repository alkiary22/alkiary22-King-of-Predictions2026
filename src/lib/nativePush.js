import { PushNotifications } from "@capacitor/push-notifications";
import api from "./api";
import { isNative } from "./platform";

function normalizeUrl(url) {
  if (!url) return "/";
  const u = String(url).trim();
  if (!u) return "/";
  return u.startsWith("/") ? u : `/${u}`;
}

export async function enableNativePush() {
  if (!isNative) return null;

  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === "prompt") {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== "granted") {
    throw new Error("لم يتم السماح بالإشعارات");
  }

  const token = await new Promise((resolve, reject) => {
    PushNotifications.addListener("registration", (t) => resolve(t.value));
    PushNotifications.addListener("registrationError", (e) =>
      reject(new Error(e?.error || "فشل تسجيل الإشعارات"))
    );
    PushNotifications.register().catch(reject);
    setTimeout(() => reject(new Error("انتهت مهلة تسجيل الإشعارات")), 20000);
  });

  await api.post("/push/register-token", { token, platform: "android" });
  localStorage.setItem("push_enabled", "1");
  alert("TOKEN:\n" + token);
  return token;
}

export async function listenNativeNotifications(onNavigate) {
  if (!isNative) return;

  await PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("Push received (foreground):", notification);
  });

  await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const url = normalizeUrl(action?.notification?.data?.url || "/");
    if (typeof onNavigate === "function") {
      onNavigate(url);
    } else {
      window.location.href = url;
    }
  });
}
