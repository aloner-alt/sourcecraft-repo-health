"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthStatus } from "@/components/auth-status";
import { AnimatedFolderGitIcon } from "@/components/animated-folder-git-icon";
import { AnimatedHomeIcon } from "@/components/animated-home-icon";
import { AnimatedTrophyIcon } from "@/components/animated-trophy-icon";

const navigation = [
  { label: "Главная", href: "/", icon: AnimatedHomeIcon },
  { label: "Топ-100", href: "/ranking", icon: AnimatedTrophyIcon },
  { label: "Мои репозитории", href: "/my-repositories", icon: AnimatedFolderGitIcon },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <aside className="app-sidebar">
    <div className="app-sidebar-top">
      <Link href="/" className="app-brand">sourcecraft<span> / health</span></Link>
      <div className="flex items-center gap-2"><AuthStatus /><ThemeToggle /></div>
      <button className="mobile-menu-button" onClick={() => setOpen(previous => !previous)} onKeyDown={event => { if (event.key === "Escape") setOpen(false); }} aria-label={open ? "Закрыть меню" : "Открыть меню"} aria-expanded={open} aria-controls="workspace-navigation">{open ? <X size={20} /> : <Menu size={20} />}</button>
    </div>
    <p className="app-sidebar-label">РАБОЧАЯ ОБЛАСТЬ</p>
    <nav id="workspace-navigation" aria-label="Основная навигация" data-open={open} onKeyDown={event => { if (event.key === "Escape") { setOpen(false); document.querySelector<HTMLButtonElement>(".mobile-menu-button")?.focus(); } }}>
      {navigation.map(({ label, href, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return <Link className="app-nav-link" key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}><Icon size={17} />{label}</Link>;
      })}
    </nav>
    <p className="app-sidebar-footer">SourceCraft Repo Health<br />Реальные данные SourceCraft</p>
  </aside>;
}
