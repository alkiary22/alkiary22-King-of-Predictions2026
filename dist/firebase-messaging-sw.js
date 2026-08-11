importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCuDfgD2sr6cen2rpCWnSE-RruEYUmLXUQ",
  authDomain: "king-of-predictions-17019.firebaseapp.com",
  projectId: "king-of-predictions-17019",
  storageBucket: "king-of-predictions-17019.firebasestorage.app",
  messagingSenderId: "966950889316",
  appId: "1:966950889316:web:ce7f538f630624c3e83c71"
});

const messaging = firebase.messaging();

function targetUrl(url) {
  const path = url && String(url).startsWith("/") ? url : "/";
  return self.location.origin + path;
}

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "ملك التوقعات";
  const body = payload?.notification?.body || "";
  const url = payload?.data?.url || "/";

  self.registration.showNotification(title, {
    body,
    icon: "/A.png",
    data: { url }
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = targetUrl(event.notification?.data?.url || "/");

  event.waitUntil(
    clients.openWindow(url)
  );
});
