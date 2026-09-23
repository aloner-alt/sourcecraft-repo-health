"use client";

// Adapted from Animate UI (MIT + Commons Clause): icons-download.
import { motion } from "motion/react";
import { useButtonIconAnimation } from "@/components/animated-sort-icon";

export function AnimatedDownloadIcon() {
  const { ref, controls } = useButtonIconAnimation();
  return (
    <svg ref={ref} aria-hidden="true" className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <motion.g initial="normal" animate={controls} variants={{ normal: { y: 0 }, animate: { y: 2 } }} transition={{ duration: 0.3, ease: "easeInOut" }}>
        <path d="M12 15V3" />
        <path d="m7 10 5 5 5-5" />
      </motion.g>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    </svg>
  );
}
