import { PushNotifications } from "@capacitor/push-notifications";
import api from "./api";
import { isNative } from "./platform";

const CHANNEL_ID = "king_high";
let channelReady = false;
let registrationDone = false;

function normalizeUrl(url) {
  if (!url) return "/";
  const u = String(url).trim();
  if (!u) return "/";
  return u.startsWith("/") ? u : `/${u}`;
}

async function ensureChannel() {
  if (channelReady) return;
  try {
    await PushNotifications.createChannel({
      id: CHANNEL_ID,
      name: "إشعارات ملك التوقعات",
      description: "إشعارات المباريات والتوقعات",
      importance: 5,
      visibility: 1,
      sound: "default",
      vibration: true,
      lights: true,
    });
    channelReady = true;
  } catch (e) {
    console.log("createChannel:", e);
  }
}

export async function enableNativePush() {
  if (!isNative) return null;

  await ensureChannel();

  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === "prompt") {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== "granted") {
    throw new Error("لم يتم السماح بالإشعارات");
  }

  if (!registrationDone) {
    registrationDone = true;
    await PushNotifications.addListener("registration", async (t) => {
      try {
        await api.post("/push/register-token", { token: t.value, platform: "android" });
        localStorage.setItem("push_enabled", "1");
        console.log("FCM token registered");
      } catch (e) {
        console.log("register-token failed:", e?.message);
      }
    });
    await PushNotifications.addListener("registrationError", (e) => {
      console.log("registrationError:", e);
    });
  }

  await PushNotifications.register();
  return true;
}

export async function autoEnableNativePush() {
  if (!isNative) return;
  try {
    await enableNativePush();
    console.log("Auto push: enabled");
  } catch (e) {
    console.log("Auto push skipped:", e?.message);
  }
}

export async function listenNativeNotifications(onNavigate) {
  if (!isNative) return;

  await ensureChannel();

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
