import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { DemoAccessGate, DemoAccountProvider } from "@/lib/demo-auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SourceCraft — Repo Health",
  description: "Repository health dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head><script dangerouslySetInnerHTML={{ __html: `try{const t=localStorage.getItem('repo-health-theme');document.documentElement.dataset.theme=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';document.documentElement.dataset.motion=localStorage.getItem('repo-health-motion')==='off'?'off':'on'}catch{document.documentElement.dataset.theme='light'}` }} /></head>
      <body className="min-h-full flex flex-col"><a className="skip-link" href="#page-content">Перейти к содержимому</a><DemoAccountProvider><SiteHeader /><div className="app-content" id="page-content" tabIndex={-1}><DemoAccessGate>{children}</DemoAccessGate></div></DemoAccountProvider></body>
    </html>
  );
}
