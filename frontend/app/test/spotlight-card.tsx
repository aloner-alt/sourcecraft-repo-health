"use client";

import type { PointerEvent, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRevealOnView } from "./use-reveal-on-view";

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
};

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const { elementRef, isVisible } = useRevealOnView<HTMLDivElement>();

  function updateSpotlight(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;

    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    card.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
    card.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
  }

  return (
    <Card
      ref={elementRef}
      className={cn("test-reveal test-spotlight-card", className)}
      data-reveal-visible={isVisible ? "true" : undefined}
      onPointerEnter={(event) => {
        updateSpotlight(event);
        event.currentTarget.dataset.spotlightActive = "true";
      }}
      onPointerMove={updateSpotlight}
      onPointerLeave={(event) => {
        delete event.currentTarget.dataset.spotlightActive;
      }}
    >
      {children}
    </Card>
  );
}
