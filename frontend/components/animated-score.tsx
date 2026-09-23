"use client";
import { useEffect, useRef } from "react";

export function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const finish = () => { cancelAnimationFrame(frame); element.textContent = String(value); };
    if (media.matches || document.documentElement.dataset.motion === "off") return;
    let start: number | undefined;
    const step = (time: number) => {
      start ??= time;
      const progress = Math.min(1, (time - start) / 800);
      element.textContent = String(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    const preferenceChange = () => { if (document.documentElement.dataset.motion === "off") finish(); };
    frame = requestAnimationFrame(step);
    media.addEventListener("change", finish);
    window.addEventListener("repo-theme-change", preferenceChange);
    return () => { finish(); media.removeEventListener("change", finish); window.removeEventListener("repo-theme-change", preferenceChange); };
  }, [value]);
  return <><span className="sr-only">{value}</span><span aria-hidden="true" ref={ref}>{value}</span></>;
}
export function AnimatedScore({ value }: { value: number }) {
  return <div className="score-visual score-ring" role="img" aria-label={`Здоровье репозитория: ${value} из 100`}>
    <svg viewBox="0 0 200 200" aria-hidden="true"><circle className="track" cx="100" cy="100" r="86" /><circle className="progress" cx="100" cy="100" r="86" pathLength="100" strokeDasharray={`${value} 100`} /></svg>
    <div className="score-number" aria-hidden="true"><strong><AnimatedNumber value={value} /></strong><span>/ 100</span></div>
  </div>;
}
