"use client";
export type ThemePreference = "light" | "dark" | "system";
export const preferenceEvent = "repo-theme-change";
export function readPreference(key: string, fallback: string) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
export function applyPreferences() {
  const preference = readPreference("repo-health-theme", "light");
  document.documentElement.dataset.theme = preference === "dark" || (preference === "system" && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  document.documentElement.dataset.motion = readPreference("repo-health-motion", "on") === "off" ? "off" : "on";
  document.documentElement.dataset.cursor = readPreference("repo-health-cursor", "on") === "off" ? "off" : "on";
}
export function savePreference(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Preferences still apply to this session. */ }
  if (key === "repo-health-theme") document.documentElement.dataset.theme = value === "dark" || (value === "system" && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  else if (key === "repo-health-motion") document.documentElement.dataset.motion = value;
  else if (key === "repo-health-cursor") document.documentElement.dataset.cursor = value;
  window.dispatchEvent(new Event(preferenceEvent));
}
export function subscribePreferences(callback: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  const externalChange = () => { applyPreferences(); callback(); };
  window.addEventListener(preferenceEvent, callback);
  window.addEventListener("storage", externalChange);
  media.addEventListener("change", externalChange);
  return () => { window.removeEventListener(preferenceEvent, callback); window.removeEventListener("storage", externalChange); media.removeEventListener("change", externalChange); };
}
