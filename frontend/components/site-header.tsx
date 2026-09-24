"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthStatus } from "@/components/auth-status";
import { AnimatedFolderGitIcon } from "@/components/animated-folder-git-icon";
import { AnimatedHomeIcon } from "@/components/animated-home-icon";
import { AnimatedTrophyIcon } from "@/components/animated-trophy-icon";
import { AnimatedMenuIcon } from "@/components/animated-navigation-icons";

const navigation = [
  { label: "Главная", href: "/", icon: AnimatedHomeIcon },
  { label: "Топ-100", href: "/ranking", icon: AnimatedTrophyIcon },
  { label: "Мои репозитории", href: "/my-repositories", icon: AnimatedFolderGitIcon },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setCollapsed(localStorage.getItem("repo-health-sidebar") === "collapsed"); }
      catch { setCollapsed(false); }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function toggleCollapsed() {
    setCollapsed(previous => {
      const next = !previous;
      try { localStorage.setItem("repo-health-sidebar", next ? "collapsed" : "expanded"); } catch {}
      return next;
    });
  }

  return <aside className="app-sidebar" data-collapsed={collapsed ? "true" : "false"}>
    <button type="button" className="sidebar-collapse-button" onClick={toggleCollapsed} aria-label={collapsed ? "Развернуть боковую панель" : "Свернуть боковую панель"} aria-expanded={!collapsed} title={collapsed ? "Развернуть панель" : "Свернуть панель"}><ChevronLeft size={19} aria-hidden="true" /></button>
    <div className="app-sidebar-top">
      <Link href="/" className="app-brand" aria-label="SourceCraft Repo Health"><span className="app-brand-full">sourcecraft<span> / health</span></span><span className="app-brand-compact" aria-hidden="true"><span className="app-brand-compact-s">s</span>/h</span></Link>
      <div className="flex items-center gap-2"><AuthStatus /><ThemeToggle /></div>
      <button type="button" className="mobile-menu-button animated-menu-button" onClick={() => setOpen(previous => !previous)} onKeyDown={event => { if (event.key === "Escape") setOpen(false); }} aria-label={open ? "Закрыть меню" : "Открыть меню"} aria-expanded={open} aria-controls="workspace-navigation"><AnimatedMenuIcon open={open} /></button>
    </div>
    <p className="app-sidebar-label">РАБОЧАЯ ОБЛАСТЬ</p>
    <nav id="workspace-navigation" aria-label="Основная навигация" data-open={open} onKeyDown={event => { if (event.key === "Escape") { setOpen(false); document.querySelector<HTMLButtonElement>(".mobile-menu-button")?.focus(); } }}>
      {navigation.map(({ label, href, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return <Link className="app-nav-link" key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} title={collapsed ? label : undefined}><Icon size={17} /><span className="app-nav-text">{label}</span></Link>;
      })}
    </nav>
    <p className="app-sidebar-footer">SourceCraft Repo Health<br />Реальные данные SourceCraft</p>
  </aside>;
}
