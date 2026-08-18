"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface CompletionBannerProps {
  show: boolean;
  label: string;
}

export function CompletionBanner({ show, label }: CompletionBannerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mx-5 overflow-hidden"
        >
          <div className="mt-3 flex items-center justify-center gap-2 rounded-radius-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-600">
            <CheckCircle2 className="size-[18px]" />
            {label}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
