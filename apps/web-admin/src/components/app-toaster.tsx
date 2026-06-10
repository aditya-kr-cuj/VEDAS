"use client";

import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#1e293b",
          color: "#f1f5f9",
          border: "1px solid #334155",
        },
        success: { iconTheme: { primary: "#86e3ce", secondary: "#0b1220" } },
        error: { iconTheme: { primary: "#f87171", secondary: "#0b1220" } },
      }}
    />
  );
}
