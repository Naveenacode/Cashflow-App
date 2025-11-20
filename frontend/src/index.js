import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import AppWrapper from "@/AppWrapper";
import { AuthProvider } from "@/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  </React.StrictMode>,
);
