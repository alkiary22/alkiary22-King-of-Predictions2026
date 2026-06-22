import api from "./api";
import { getFirebaseMessaging, getToken, onMessage } from "../firebase";

const VAPID_KEY = "BA2jrAg39veDM8JCWwP2eQt4K5l7f0wGnYCnuydz0SEELDZ1JPPQWhWUpPAhP0e_DG8vSQ0XLeJq6Ytt5C4NqHM";

export async function enablePushNotifications() {
  if (!("Notification" in window)) {
    throw new Error("هذا المتصفح لا يدعم الإشعارات");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("لم يتم السماح بالإشعارات");
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    throw new Error("الإشعارات غير مدعومة على هذا الجهاز");
  }

  const token = await getToken(messaging, { vapidKey: VAPID_KEY });

  if (!token) {
    throw new Error("لم يتم إنشاء رمز الإشعارات");
  }

  await api.post("/push/register-token", { token });

  localStorage.setItem("push_enabled", "1");
  return token;
}

export async function listenForegroundNotifications() {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    const title = payload?.notification?.title || "ملك التوقعات";
    const body = payload?.notification?.body || "";
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  });
}
