"use client";

import { motion } from "motion/react";
import { useButtonIconAnimation } from "@/components/animated-sort-icon";

export function AnimatedPlusIcon({ size = 17 }: { size?: number }) {
  const { ref, controls } = useButtonIconAnimation();
  const variants = {
    normal: { pathLength: 1, opacity: 1 },
    animate: { pathLength: [0, 1], opacity: [0, 1] },
  };

  return <svg ref={ref} width={size} height={size} className="animated-navigation-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <motion.path d="M12 5v14" initial="normal" animate={controls} variants={variants} transition={{ duration: .3, ease: "easeOut" }} />
    <motion.path d="M5 12h14" initial="normal" animate={controls} variants={variants} transition={{ duration: .3, delay: .08, ease: "easeOut" }} />
  </svg>;
}
