import React from "react";

export default function OfflineScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#000",
        color: "#fff",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 70 }}>📶</div>

      <h2>لا يوجد اتصال بالإنترنت</h2>

      <p style={{ opacity: 0.8 }}>
        تحقق من اتصالك بالإنترنت ثم أعد المحاولة.
      </p>

      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: 20,
          background: "#d4af37",
          color: "#000",
          border: "none",
          borderRadius: 12,
          padding: "12px 24px",
          fontSize: 16,
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
