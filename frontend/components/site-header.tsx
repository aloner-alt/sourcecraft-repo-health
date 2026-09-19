"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical, LogIn } from "lucide-react";
import { AnimatedTrophyIcon } from "@/components/animated-trophy-icon";
import { AnimatedHomeIcon } from "@/components/animated-home-icon";
import { AnimatedFolderGitIcon } from "@/components/animated-folder-git-icon";
import { useState } from "react";
import { AnimatedChartIcon, AnimatedMenuIcon, AnimatedSettingsIcon } from "@/components/animated-navigation-icons";

const navigation = [
  { label: "Главная", href: "/", icon: AnimatedHomeIcon },
  { label: "Топ-100", href: "/ranking", icon: AnimatedTrophyIcon },
  { label: "Мои репозитории", href: "/my-repositories", icon: AnimatedFolderGitIcon },
  { label: "Обзор репозитория", href: "/repositories/api-gateway", icon: AnimatedChartIcon },
  { label: "Настройки", href: "/settings", icon: AnimatedSettingsIcon },
  { label: "Test", href: "/test", icon: FlaskConical },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <aside className="app-sidebar">
    <div className="app-sidebar-top"><Link href="/" className="app-brand">sourcecraft<span> / health</span></Link>
    <button type="button" className="mobile-menu-button animated-menu-button" onClick={() => setOpen(previous => !previous)} onKeyDown={event => { if (event.key === "Escape") setOpen(false); }} aria-label={open ? "Закрыть меню" : "Открыть меню"} aria-expanded={open} aria-controls="workspace-navigation"><AnimatedMenuIcon open={open} /></button></div>
    <p className="app-sidebar-label">РАБОЧАЯ ОБЛАСТЬ</p>
    <div className="mobile-navigation-reveal" data-open={open}><nav id="workspace-navigation" aria-label="Основная навигация" data-open={open} onKeyDown={event => { if (event.key === "Escape") { setOpen(false); document.querySelector<HTMLButtonElement>(".mobile-menu-button")?.focus(); } }}>
      {navigation.map(({ label, href, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : href.startsWith("/repositories") ? pathname.startsWith("/repositories/") : pathname.startsWith(href);
        return <Link className="app-nav-link" key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}><Icon size={17} />{label}</Link>;
      })}
      <button type="button" className="app-nav-link mobile-account-entry yandex-entry" disabled title="Вход через Я ID будет доступен после подключения backend"><LogIn size={17} aria-hidden="true" />Войти через Я ID</button>
    </nav></div>
    <div className="sidebar-account"><button type="button" className="app-nav-link yandex-entry" disabled title="Вход через Я ID будет доступен после подключения backend"><LogIn size={17} aria-hidden="true" />Войти через Я ID</button><p className="app-sidebar-footer">SourceCraft Repo Health<br />Демонстрационные данные</p></div>
  </aside>;
}
