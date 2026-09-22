"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, CircleUserRound, FlaskConical, LogIn } from "lucide-react";
import { AnimatedTrophyIcon } from "@/components/animated-trophy-icon";
import { AnimatedHomeIcon } from "@/components/animated-home-icon";
import { AnimatedFolderGitIcon } from "@/components/animated-folder-git-icon";
import { useEffect, useState } from "react";
import { AnimatedChartIcon, AnimatedMenuIcon, AnimatedSettingsIcon } from "@/components/animated-navigation-icons";
import { isProtectedDemoRoute } from "@/lib/demo-access";
import { useDemoAccount } from "@/lib/demo-auth";

const navigation = [
  { label: "Главная", href: "/", icon: AnimatedHomeIcon },
  { label: "Топ-100", href: "/ranking", icon: AnimatedTrophyIcon },
  { label: "Мои репозитории", href: "/my-repositories", icon: AnimatedFolderGitIcon },
  { label: "Обзор репозитория", href: "/repositories/checkout-service", icon: AnimatedChartIcon },
  { label: "Настройки", href: "/settings", icon: AnimatedSettingsIcon },
  { label: "Test", href: "/test", icon: FlaskConical },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { status, setStatus } = useDemoAccount();
  const registered = status === "registered";
  const isTestPage = pathname.startsWith("/test");

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

  const accountToggle = (mobile: boolean) => <button
    type="button"
    role="switch"
    aria-checked={registered}
    aria-label={registered ? "Демо-аккаунт включён. Переключить на гостя" : "Гостевой режим. Включить демо-аккаунт"}
    title={registered ? "Переключить на гостя" : "Включить демо-аккаунт"}
    className={`app-nav-link demo-account-toggle${mobile ? " mobile-account-entry" : ""}`}
    disabled={status === "loading"}
    onClick={() => setStatus(registered ? "guest" : "registered")}
  >
    {registered ? <CircleUserRound size={17} aria-hidden="true" /> : <LogIn size={17} aria-hidden="true" />}
    <span className="app-nav-text">{registered ? "Демо: аккаунт" : "Демо: гость"}</span>
  </button>;

  return <aside className="app-sidebar" data-collapsed={collapsed ? "true" : "false"} data-test-page={isTestPage ? "true" : undefined}>
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
        const active = href === "/" ? pathname === "/" : href.startsWith("/repositories") ? pathname.startsWith("/repositories/") : pathname.startsWith(href);
        const destination = !registered && isProtectedDemoRoute(href) ? `/register?next=${encodeURIComponent(href)}` : href;
        return <Link className="app-nav-link" key={href} href={destination} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} title={collapsed ? label : undefined}><Icon size={17} /><span className="app-nav-text">{label}</span></Link>;
      })}
      {accountToggle(true)}
    </nav></div>
    <div className="sidebar-account">{accountToggle(false)}<p className="app-sidebar-footer">SourceCraft Repo Health<br />Демонстрационные данные</p></div>
  </aside>;
}
