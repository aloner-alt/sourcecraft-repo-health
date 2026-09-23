"use client";

// Adapted from Animate UI, MIT + Commons Clause. See THIRD-PARTY-NOTICES.md.
import { motion, useReducedMotion } from "motion/react";
import { Settings } from "lucide-react";
import { useSyncExternalStore } from "react";
import { readPreference, subscribePreferences } from "@/lib/preferences";
import { useButtonIconAnimation } from "@/components/animated-sort-icon";

const svgProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };

export function AnimatedSettingsIcon({ size = 17 }: { size?: number }) {
  const { ref, controls } = useButtonIconAnimation();
  return <svg {...svgProps} ref={ref} width={size} height={size} className="animated-navigation-icon"><motion.g initial="normal" animate={controls} variants={{ normal: { rotate: 0 }, animate: { rotate: [0, 90, 180] } }} transition={{ duration: 0.45, ease: "easeInOut" }} style={{ transformOrigin: "12px 12px" }}><Settings className="animated-navigation-icon" size={24} aria-hidden="true" /></motion.g></svg>;
}

export function AnimatedChartIcon({ size = 17 }: { size?: number }) {
  const { ref, controls } = useButtonIconAnimation();
  return <svg {...svgProps} ref={ref} width={size} height={size} className="animated-navigation-icon">{["M8 17V13", "M13 17V9", "M18 17V5"].map((d, index) => <motion.path key={d} d={d} initial="normal" animate={controls} variants={{ normal: { opacity: 1, pathLength: 1 }, animate: { opacity: [0, 1], pathLength: [0, 1] } }} transition={{ duration: 0.22, delay: index * 0.08, ease: "easeInOut" }} />)}<path d="M3 3v16a2 2 0 0 0 2 2h16" /></svg>;
}

export function AnimatedMenuIcon({ open }: { open: boolean }) {
  const reducedMotion = useReducedMotion();
  const motionEnabled = useSyncExternalStore(subscribePreferences, () => readPreference("repo-health-motion", "on") !== "off", () => true);
  const instant = reducedMotion || !motionEnabled;
  const active = open;
  const transition = instant ? { duration: 0 } : { type: "spring" as const, stiffness: 200, damping: 20 };
  return <svg {...svgProps} width={24} height={24}>
    <motion.path initial={false} animate={{ d: active ? "M5 5L19 19" : "M4 6L20 6" }} transition={transition} />
    <motion.line x1={4} y1={12} x2={20} y2={12} initial={false} animate={{ opacity: active ? 0 : 1 }} transition={{ duration: instant ? 0 : 0.2, ease: "easeInOut" }} />
    <motion.path initial={false} animate={{ d: active ? "M19 5L5 19" : "M4 18L20 18" }} transition={transition} />
  </svg>;
}
