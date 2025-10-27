import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import axios from "axios";

// Apply saved access token (if any) to axios defaults on app startup
try {
  const token = localStorage.getItem("access_token");
  if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
} catch (e) {
  // accessing localStorage can throw in some environments (e.g. server-side), ignore safely
  // console.debug("Unable to set axios default Authorization header:", e);
}

// Optionally fetch a dev token from the backend (only enabled in dev via env)
if (process.env.REACT_APP_ENABLE_DEV_TOKEN === "true") {
  (async () => {
    try {
      const apiBase = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
      const resp = await fetch(`${apiBase}/api/dev/token`, { credentials: "include" });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.access_token) {
          localStorage.setItem("access_token", data.access_token);
          axios.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;
        }
      }
    } catch (err) {
      // ignore — backend may not expose dev endpoint in prod
    }
  })();
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
