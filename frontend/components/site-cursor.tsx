"use client";

import { useEffect, useRef } from "react";

export function SiteCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const ring = cursor?.querySelector<HTMLElement>(".site-cursor-ring");
    if (!cursor || !ring) return;

    const root = document.documentElement;
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let pointerX = 0;
    let pointerY = 0;
    let ringX = 0;
    let ringY = 0;
    let positioned = false;
    let frame = 0;

    // Limit the lag to keep the dot inside the ring, including while it contracts.
    const clampRing = () => {
      const maxLag = cursor.dataset.pressed === "true" ? 5 : 8;
      const dx = ringX - pointerX;
      const dy = ringY - pointerY;
      const distance = Math.hypot(dx, dy);
      if (distance > maxLag) {
        ringX = pointerX + dx * maxLag / distance;
        ringY = pointerY + dy * maxLag / distance;
      }
    };

    const placeRing = () => {
      ring.style.left = `${ringX - pointerX}px`;
      ring.style.top = `${ringY - pointerY}px`;
    };

    const follow = () => {
      frame = 0;
      ringX += (pointerX - ringX) * .22;
      ringY += (pointerY - ringY) * .22;
      clampRing();
      placeRing();
      if (Math.hypot(pointerX - ringX, pointerY - ringY) > .1) frame = requestAnimationFrame(follow);
    };

    const startFollowing = () => {
      if (!frame) frame = requestAnimationFrame(follow);
    };

    const hide = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      positioned = false;
      delete root.dataset.customCursor;
      cursor.dataset.visible = "false";
      cursor.dataset.interactive = "false";
      cursor.dataset.pressed = "false";
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !finePointer.matches || reducedMotion.matches || root.dataset.cursor === "off") {
        hide();
        return;
      }

      const target = event.target;
      if (!(target instanceof Element) || target.closest("input:not([type='checkbox']):not([type='radio']), textarea, select, [contenteditable], [draggable='true']")) {
        hide();
        return;
      }

      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!positioned) {
        ringX = pointerX;
        ringY = pointerY;
        positioned = true;
      }
      cursor.style.left = `${pointerX}px`;
      cursor.style.top = `${pointerY}px`;
      cursor.dataset.visible = "true";
      cursor.dataset.interactive = target.closest("a, button, summary, label, input[type='checkbox'], input[type='radio'], [role='button'], [role='link'], [role='switch']") ? "true" : "false";
      root.dataset.customCursor = "active";
      clampRing();
      placeRing();
      startFollowing();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0 || cursor.dataset.visible !== "true") return;
      cursor.dataset.pressed = "true";
      clampRing();
      placeRing();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      cursor.dataset.pressed = "false";
      if (cursor.dataset.visible === "true") startFollowing();
    };

    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) hide();
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", hide);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("blur", hide);
    window.addEventListener("repo-theme-change", hide);
    finePointer.addEventListener("change", hide);
    reducedMotion.addEventListener("change", hide);

    return () => {
      hide();
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", hide);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("blur", hide);
      window.removeEventListener("repo-theme-change", hide);
      finePointer.removeEventListener("change", hide);
      reducedMotion.removeEventListener("change", hide);
    };
  }, []);

  return <div ref={cursorRef} className="site-cursor" data-visible="false" data-pressed="false" aria-hidden="true"><span className="site-cursor-ring" /><span className="site-cursor-dot" /></div>;
}
