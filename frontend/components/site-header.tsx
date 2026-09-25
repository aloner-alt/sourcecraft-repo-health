"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AnimatedTrophyIcon } from "@/components/animated-trophy-icon";
import { AnimatedHomeIcon } from "@/components/animated-home-icon";
import { AnimatedPlusIcon } from "@/components/animated-plus-icon";
import { AnimatedFolderGitIcon } from "@/components/animated-folder-git-icon";
import { useEffect, useState } from "react";
import { AnimatedChartIcon, AnimatedMenuIcon, AnimatedSettingsIcon } from "@/components/animated-navigation-icons";
import { AuthStatus } from "@/components/auth-status";

const navigation = [
  { label: "Главная", href: "/", icon: AnimatedHomeIcon },
  { label: "Проверить репозиторий", href: "/check-repository", icon: AnimatedPlusIcon },
  { label: "Мои репозитории", href: "/my-repositories", icon: AnimatedFolderGitIcon },
  { label: "Обзор репозитория", href: "/repositories", icon: AnimatedChartIcon },
  { label: "Топ-100", href: "/ranking", icon: AnimatedTrophyIcon },
  { label: "Настройки", href: "/settings", icon: AnimatedSettingsIcon },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        setCollapsed(localStorage.getItem("repo-health-sidebar") === "collapsed");
      } catch {
        setCollapsed(false);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(previous => {
      const next = !previous;
      try {
        localStorage.setItem("repo-health-sidebar", next ? "collapsed" : "expanded");
      } catch {}
      return next;
    });
  };

  return <aside className="app-sidebar" data-collapsed={collapsed ? "true" : "false"}>
    <svg className="app-sidebar-gradient-defs" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="app-sidebar-blue-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="82%" stopColor="#153885" />
        </linearGradient>
      </defs>
    </svg>
    <button
      type="button"
      className="sidebar-collapse-button"
      onClick={toggleCollapsed}
      aria-label={collapsed ? "Развернуть боковую панель" : "Свернуть боковую панель"}
      aria-expanded={!collapsed}
      title={collapsed ? "Развернуть панель" : "Свернуть панель"}
    >
      <ChevronLeft size={19} aria-hidden="true" />
    </button>
    <div className="app-sidebar-top"><Link href="/" className="app-brand" aria-label="SourceCraft Repo Health"><span className="app-brand-full">sourcecraft<span className="app-brand-accent"> / health</span></span><span className="app-brand-compact" aria-hidden="true"><span className="app-brand-compact-s">s</span>/h</span></Link>
    <button type="button" className="mobile-menu-button animated-menu-button" onClick={() => setOpen(previous => !previous)} onKeyDown={event => { if (event.key === "Escape") setOpen(false); }} aria-label={open ? "Закрыть меню" : "Открыть меню"} aria-expanded={open} aria-controls="workspace-navigation"><AnimatedMenuIcon open={open} /></button></div>
    <p className="app-sidebar-label">РАБОЧАЯ ОБЛАСТЬ</p>
    <div className="mobile-navigation-reveal" data-open={open}><nav id="workspace-navigation" aria-label="Основная навигация" data-open={open} onKeyDown={event => { if (event.key === "Escape") { setOpen(false); document.querySelector<HTMLButtonElement>(".mobile-menu-button")?.focus(); } }}>
      {navigation.map(({ label, href, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : href === "/repositories" ? pathname.startsWith("/repositories") : pathname.startsWith(href);
        return <Link className={`app-nav-link${href === "/check-repository" ? " check-repository-nav-link" : ""}`} key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} title={collapsed ? label : undefined}><Icon size={17} /><span className="app-nav-text">{label}</span></Link>;
      })}
      <div className="mobile-account-entry"><AuthStatus /></div>
    </nav></div>
    <div className="sidebar-account"><AuthStatus /><p className="app-sidebar-footer">SourceCraft Repo Health<br />Данные SourceCraft</p></div>
  </aside>;
}
