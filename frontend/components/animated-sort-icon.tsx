"use client";

// Adapted from Animate UI (MIT + Commons Clause): icons-arrow-up-down.
import { motion, useAnimation, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

export function AnimatedSortIcon() {
  const { ref, controls } = useButtonIconAnimation();
  const variants = {
    normal: { translateY: 0 },
    animate: (direction: number) => ({ translateY: direction * 3 }),
  };
  const transition = { ease: "easeInOut" as const, duration: 0.3 };

  return (
    <svg ref={ref} aria-hidden="true" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <motion.g animate={controls} custom={1} initial="normal" transition={transition} variants={variants}>
        <path d="m21 16-4 4-4-4" /><path d="M17 20V4" />
      </motion.g>
      <motion.g animate={controls} custom={-1} initial="normal" transition={transition} variants={variants}>
        <path d="m3 8 4-4 4 4" /><path d="M7 4v16" />
      </motion.g>
    </svg>
  );
}

export function useButtonIconAnimation() {
  const ref = useRef<SVGSVGElement>(null);
  const controls = useAnimation();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const button = ref.current?.closest("button, a");
    if (!button) return;
    const start = () => {
      if (reducedMotion || document.documentElement.dataset.motion === "off") return;
      controls.stop();
      controls.set("normal");
      void controls.start("animate");
    };
    const stop = () => { void controls.start("normal"); };
    button.addEventListener("pointerenter", start);
    button.addEventListener("pointerleave", stop);
    button.addEventListener("focus", start);
    button.addEventListener("blur", stop);
    button.addEventListener("click", start);
    return () => {
      button.removeEventListener("pointerenter", start);
      button.removeEventListener("pointerleave", stop);
      button.removeEventListener("focus", start);
      button.removeEventListener("blur", stop);
      button.removeEventListener("click", start);
    };
  }, [controls, reducedMotion]);

  return { ref, controls };
}
