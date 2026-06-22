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

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo192.png"
  });
});
