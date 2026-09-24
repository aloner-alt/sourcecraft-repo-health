"use client";

// Adapted from pqoqubbw/icons (MIT): home.
import { motion } from "motion/react";
import { useButtonIconAnimation } from "@/components/animated-sort-icon";

export function AnimatedHomeIcon({ size = 17 }: { size?: number }) {
  const { ref, controls } = useButtonIconAnimation();
  return <svg ref={ref} width={size} height={size} className="animated-navigation-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <motion.path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" initial="normal" animate={controls} variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { opacity: [0, 1], pathLength: [0, 1] } }} transition={{ duration: 0.45, opacity: { duration: 0.2 } }} />
  </svg>;
}
