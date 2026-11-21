
"use client";

import { useEffect } from "react";

export default function ThemeInitializer() {
  useEffect(() => {
    function applyTheme() {
      const saved =
        localStorage.getItem("mentorTokenTheme") || "system";

      document.documentElement.dataset.theme =
        ["light", "dark", "system"].includes(saved)
          ? saved
          : "system";
    }

    applyTheme();

    window.addEventListener("storage", applyTheme);
    window.addEventListener("theme-updated", applyTheme);

    return () => {
      window.removeEventListener("storage", applyTheme);
      window.removeEventListener("theme-updated", applyTheme);
    };
  }, []);

  return null;
}
