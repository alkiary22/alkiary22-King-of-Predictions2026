import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import eruda from "eruda";
import ErrorBoundary from "./ErrorBoundary";

if (window.location.protocol !== "http:" && window.location.protocol !== "https:") {
  eruda.init();
}

window.onerror = function(message, source, line, col, error) {
  console.error(message, source, line, col, error);
};

window.onunhandledrejection = function(e) {
  console.error("Unhandled Promise:", e.reason);
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
