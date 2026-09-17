"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("repo-theme-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("repo-theme-change", callback);
    window.removeEventListener("storage", callback);
  };
}
function snapshot() { return document.documentElement.dataset.theme === "dark"; }

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, snapshot, () => false);
  function toggle() {
    const theme = dark ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("repo-health-theme", theme); } catch { /* Theme works even when storage is unavailable. */ }
    window.dispatchEvent(new Event("repo-theme-change"));
  }
  return <button type="button" className="theme-toggle" onClick={toggle} aria-pressed={dark} aria-label="Тёмная тема" title={dark ? "Включить светлую тему" : "Включить тёмную тему"}>
    {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}<span>{dark ? "Светлая тема" : "Тёмная тема"}</span>
  </button>;
}
