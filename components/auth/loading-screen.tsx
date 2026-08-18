"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function LoadingScreen({ label = "Routine laden…" }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative flex size-20 items-center justify-center"
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-radius-lg bg-accent/20 blur-md"
        />
        <div className="relative flex size-16 items-center justify-center overflow-hidden rounded-radius-lg shadow-soft-md">
          <Image src="/icons/icon-192.png" alt="" width={64} height={64} priority />
        </div>
      </motion.div>

      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-accent"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}
      </div>

      <span className="text-sm text-foreground-muted">{label}</span>
    </div>
  );
}
