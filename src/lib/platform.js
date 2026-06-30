import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();

export const isWeb = !isNative;

export const hasNotificationAPI =
  typeof window !== "undefined" &&
  typeof Notification !== "undefined";

export const hasServiceWorker =
  typeof navigator !== "undefined" &&
  "serviceWorker" in navigator;
