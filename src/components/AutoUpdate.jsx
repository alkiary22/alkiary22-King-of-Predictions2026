import { useEffect } from "react";

export default function AutoUpdate() {
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: "no-store",
        });

        const data = await res.json();
        const saved = localStorage.getItem("app_version");

        if (!saved && data.version) {
          localStorage.setItem("app_version", data.version);
          return;
        }

        if (data.version && saved !== data.version) {
          localStorage.setItem("app_version", data.version);
          window.location.reload();
        }
      } catch (e) {
        console.log("Auto update check failed");
      }
    };

    checkUpdate();
    const timer = setInterval(checkUpdate, 60000);

    return () => clearInterval(timer);
  }, []);

  return null;
}
