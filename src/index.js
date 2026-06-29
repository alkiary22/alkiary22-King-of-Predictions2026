import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

window.onerror = function(message, source, line, col, error) {
  document.body.innerHTML =
    "<div style='padding:20px;background:#111;color:#fff;font-size:16px;direction:rtl'>" +
    "<h2>حدث خطأ داخل التطبيق</h2>" +
    "<pre>" + message + "</pre>" +
    "</div>";
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
