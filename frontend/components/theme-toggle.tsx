"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { savePreference, subscribePreferences } from "@/lib/preferences";

function snapshot() { return document.documentElement.dataset.theme === "dark"; }

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribePreferences, snapshot, () => false);
  function toggle() {
    const theme = dark ? "light" : "dark";
    savePreference("repo-health-theme", theme);
  }
  return <button type="button" className="theme-toggle" onClick={toggle} aria-pressed={dark} aria-label="Тёмная тема" title={dark ? "Включить светлую тему" : "Включить тёмную тему"}>
    {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}<span>{dark ? "Светлая тема" : "Тёмная тема"}</span>
  </button>;
}
