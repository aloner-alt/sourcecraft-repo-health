"use client";

// Adapted from pqoqubbw/icons (MIT): folder-git-2.
import { motion } from "motion/react";
import { useButtonIconAnimation } from "@/components/animated-sort-icon";

export function AnimatedFolderGitIcon({ size = 17 }: { size?: number }) {
  const { ref, controls } = useButtonIconAnimation();
  const variants = {
    normal: { pathLength: 1, opacity: 1, transition: { delay: 0 } },
    animate: { pathLength: [0, 1], opacity: [0, 1] },
  };
  return <svg ref={ref} width={size} height={size} className="animated-navigation-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v5" />
    <motion.circle cx="13" cy="12" r="2" initial="normal" animate={controls} variants={variants} transition={{ duration: 0.22, delay: 0.05 }} />
    <motion.path d="M18 19c-2.8 0-5-2.2-5-5v8" initial="normal" animate={controls} variants={{ normal: { pathLength: 1, pathOffset: 0, opacity: 1, transition: { delay: 0 } }, animate: { pathLength: [0, 1], opacity: [0, 1], pathOffset: [1, 0] } }} transition={{ duration: 0.22, delay: 0.27 }} />
    <motion.circle cx="20" cy="19" r="2" initial="normal" animate={controls} variants={variants} transition={{ duration: 0.22, delay: 0.49 }} />
  </svg>;
}
