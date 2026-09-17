"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, House, Trophy, FolderGit2, ChartNoAxesCombined } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  { label: "Главная", href: "/", icon: House },
  { label: "Топ-100", href: "/ranking", icon: Trophy },
  { label: "Мои репозитории", href: "/my-repositories", icon: FolderGit2 },
  { label: "Обзор репозитория", href: "/repositories/api-gateway", icon: ChartNoAxesCombined },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <aside className="app-sidebar">
    <div className="app-sidebar-top"><Link href="/" className="app-brand">sourcecraft<span> / health</span></Link><ThemeToggle />
    <button className="mobile-menu-button" onClick={() => setOpen(!open)} onKeyDown={event => { if (event.key === "Escape") setOpen(false); }} aria-label={open ? "Закрыть меню" : "Открыть меню"} aria-expanded={open} aria-controls="workspace-navigation">{open ? <X size={20} /> : <Menu size={20} />}</button></div>
    <p className="app-sidebar-label">РАБОЧАЯ ОБЛАСТЬ</p>
    <nav id="workspace-navigation" aria-label="Основная навигация" data-open={open} onKeyDown={event => { if (event.key === "Escape") { setOpen(false); document.querySelector<HTMLButtonElement>(".mobile-menu-button")?.focus(); } }}>
      {navigation.map(({ label, href, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : href.startsWith("/repositories") ? pathname.startsWith("/repositories/") : pathname.startsWith(href);
        return <Link className="app-nav-link" key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}><Icon size={17} />{label}</Link>;
      })}
    </nav>
    <p className="app-sidebar-footer">SourceCraft Repo Health<br />Демонстрационные данные</p>
  </aside>;
}
