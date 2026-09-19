"use client";

import { motion } from "motion/react";
import { useButtonIconAnimation } from "@/components/animated-sort-icon";

export function AnimatedTrophyIcon({ size = 17 }: { size?: number }) {
  const { ref, controls } = useButtonIconAnimation();
  return <svg ref={ref} width={size} height={size} className="animated-navigation-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <motion.g initial="normal" animate={controls} variants={{ normal: { rotate: 0, y: 0 }, animate: { rotate: [0, -7, 5, 0], y: [0, -0.8, -0.4, 0] } }} transition={{ duration: 0.5, ease: "easeInOut" }} style={{ transformOrigin: "12px 19px" }}>
      <path d="M8 3h8v6a4 4 0 0 1-8 0V3Z" />
      <path d="M8 5H5a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4M16 5h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4M12 13v6" />
      <motion.path d="M10.5 5.5v2" strokeWidth="1.3" initial="normal" animate={controls} variants={{ normal: { opacity: 0 }, animate: { opacity: [0, 0.9, 0] } }} transition={{ duration: 0.4, delay: 0.08, ease: "easeInOut" }} />
    </motion.g>
    <path d="M8 21v-1a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1M7 21h10" />
  </svg>;
}
