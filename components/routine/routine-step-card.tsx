"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Plus, Scissors, SkipForward, Undo2 } from "lucide-react";
import type { RoutineStepView } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/products/product-image";
import { Button } from "@/components/ui/button";
import { frequencyLabel, stepCategoryLabel } from "@/lib/utils/format";
import { MANUAL_STEP_SCHEREN } from "@/lib/utils/routine";

interface RoutineStepCardProps {
  step: RoutineStepView;
  index: number;
  onToggle: () => void;
  onSkip?: () => void;
  onUnskip?: () => void;
}

export function RoutineStepCard({ step, index, onToggle, onSkip, onUnskip }: RoutineStepCardProps) {
  const { completed, skippedToday, optionalToday, placeholder } = step;
  const number = String(index).padStart(2, "0");

  if (placeholder) {
    return (
      <div className="flex items-center gap-4 rounded-radius-lg border border-dashed border-border-strong bg-surface-2/60 p-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-radius bg-surface text-foreground-subtle">
          <Scissors className="size-6" strokeWidth={1.6} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold tracking-wide text-foreground-subtle">
            {number} — {stepCategoryLabel(step).toUpperCase()}
          </p>
          <p className="font-medium text-foreground">{step.label}</p>
          <p className="text-sm text-foreground-muted">{step.subLabel}</p>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link href="/products/new?shaveOnly=1">
            <Plus className="size-3.5" />
            Toevoegen
          </Link>
        </Button>
      </div>
    );
  }

  if (!step.scheduledToday) {
    return (
      <div className="flex items-center gap-4 rounded-radius-lg border border-border/70 bg-surface-2/40 p-4">
        <ProductImage
          image={step.product?.image}
          name={step.label}
          category={step.product?.category}
          className="size-16 shrink-0 opacity-60 grayscale-[0.3]"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold tracking-wide text-foreground-subtle">
            {number} — {stepCategoryLabel(step).toUpperCase()}
          </p>
          <p className="truncate font-medium text-foreground-muted">{step.label}</p>
          <p className="text-sm text-foreground-subtle">Niet nodig vandaag</p>
        </div>
      </div>
    );
  }

  if (skippedToday) {
    return (
      <div className="flex items-center gap-4 rounded-radius-lg border border-border bg-surface-2/50 p-4 opacity-70">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-radius bg-muted text-foreground-subtle">
          <SkipForward className="size-6" strokeWidth={1.6} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold tracking-wide text-foreground-subtle">
            {number} — {stepCategoryLabel(step).toUpperCase()}
          </p>
          <p className="font-medium text-foreground">{step.label}</p>
          <p className="text-sm text-foreground-muted">Vandaag overgeslagen</p>
        </div>
        {onUnskip && (
          <Button size="icon-sm" variant="ghost" onClick={onUnskip} aria-label="Overslaan ongedaan maken">
            <Undo2 className="size-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      layout
      className={cn(
        "flex flex-col gap-3 rounded-radius-lg border p-4 transition-colors sm:flex-row sm:items-center",
        completed ? "border-green-200 bg-green-50/60" : "border-border bg-surface"
      )}
    >
      <div className="flex flex-1 items-center gap-4 min-w-0">
        <ProductImage
          image={step.product?.image}
          name={step.label}
          category={step.product?.category}
          icon={step.id === MANUAL_STEP_SCHEREN ? Scissors : undefined}
          className="size-16 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold tracking-wide text-foreground-subtle">
              {number} — {stepCategoryLabel(step).toUpperCase()}
            </p>
            {optionalToday && (
              <span className="rounded-radius-full bg-beige-50 px-2 py-0.5 text-[10px] font-medium text-navy-500">
                Optioneel
              </span>
            )}
          </div>
          <p className="truncate font-semibold text-foreground">{step.label}</p>
          {step.subLabel && <p className="text-sm text-foreground-muted">{step.subLabel}</p>}
          {step.product && (
            <p className="mt-0.5 text-xs text-foreground-subtle">{frequencyLabel(step.product)}</p>
          )}
          {step.instructions && (
            <p className="mt-1.5 text-[13px] leading-snug text-foreground-muted">
              {step.instructions}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
        {optionalToday && !completed && onSkip && (
          <Button size="sm" variant="ghost" onClick={onSkip} className="text-foreground-muted">
            Overslaan
          </Button>
        )}
        <Button
          size="sm"
          variant={completed ? "success" : "outline"}
          onClick={onToggle}
          className={cn("min-w-[118px]", completed && "pointer-events-auto")}
        >
          {completed ? (
            <>
              <Check className="size-4" />
              Gedaan
            </>
          ) : (
            <>
              <span className="size-2 rounded-full border-2 border-current" />
              Nog doen
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
