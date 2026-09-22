"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useRevealOnView } from "./use-reveal-on-view";

type ViewportRevealProps = {
  children: ReactNode;
  className?: string;
};

export function ViewportReveal({ children, className }: ViewportRevealProps) {
  const { elementRef, isVisible } = useRevealOnView<HTMLDivElement>();

  return (
    <div
      ref={elementRef}
      className={cn("test-reveal", className)}
      data-reveal-visible={isVisible ? "true" : undefined}
    >
      {children}
    </div>
  );
}
