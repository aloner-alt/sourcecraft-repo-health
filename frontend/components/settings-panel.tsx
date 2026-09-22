"use client";
import { useSyncExternalStore } from "react";
import { readPreference, savePreference, subscribePreferences } from "@/lib/preferences";

export function SettingsPanel() {
  const theme = useSyncExternalStore(subscribePreferences, () => readPreference("repo-health-theme", "light"), () => "light");
  const motion = useSyncExternalStore(subscribePreferences, () => readPreference("repo-health-motion", "on"), () => "on");
  const cursor = useSyncExternalStore(subscribePreferences, () => readPreference("repo-health-cursor", "on"), () => "on");
  return <div className="settings-stack">
    <section className="settings-card"><h2>Внешний вид</h2><p>Предпочтения сохраняются в этом браузере.</p>
      <fieldset><legend>Цветовая тема</legend><div className="preference-options">{[{value:"light",label:"Светлая"},{value:"dark",label:"Тёмная"},{value:"system",label:"Системная"}].map(item => <label key={item.value}><input type="radio" name="theme" value={item.value} checked={theme === item.value} onChange={() => savePreference("repo-health-theme", item.value)} />{item.label}</label>)}</div></fieldset>
      <label className="motion-option"><span className="motion-switch"><input type="checkbox" role="switch" checked={motion !== "off"} onChange={event => savePreference("repo-health-motion", event.target.checked ? "on" : "off")} /><span className="motion-switch-track" aria-hidden="true" /></span>Плавные анимации</label><p>Системная настройка уменьшения движения имеет приоритет.</p>
      <label className="motion-option"><span className="motion-switch"><input type="checkbox" role="switch" checked={cursor !== "off"} onChange={event => savePreference("repo-health-cursor", event.target.checked ? "on" : "off")} /><span className="motion-switch-track" aria-hidden="true" /></span>Кастомный курсор</label><p>Работает с мышью независимо от переключателя анимаций. На сенсорных устройствах используется системный курсор.</p>
    </section>
    <section className="settings-card"><h2>Аккаунт</h2><p>Авторизация доступна только через Я ID. Вход будет подключён после готовности backend; отдельная регистрация не требуется.</p></section>
  </div>;
}
