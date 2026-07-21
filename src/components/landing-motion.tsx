"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function LandingIntro({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function LandingReveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function LandingLift({ children, className }: { children: ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      whileHover={shouldReduceMotion ? undefined : { y: -7, transition: { duration: 0.22, ease: "easeOut" } }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
    >
      {children}
    </motion.div>
  );
}

export function AmbientGlow() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="absolute left-[10%] top-[-14rem] size-[36rem] rounded-full bg-[#e1efb6] opacity-60 blur-3xl"
        animate={shouldReduceMotion ? undefined : { scale: [1, 1.08, 1], x: [0, 18, 0], y: [0, 12, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute right-[-9rem] top-20 size-[28rem] rounded-full bg-[#d9e9df] opacity-70 blur-3xl"
        animate={shouldReduceMotion ? undefined : { scale: [1.04, 0.96, 1.04], x: [0, -14, 0], y: [0, -12, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}
