import { ChevronRight } from "lucide-react";

interface PhaseIndicatorProps {
  label: string;
  steps: string[];
}

export function PhaseIndicator({ label, steps }: PhaseIndicatorProps) {
  if (steps.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-1 text-xs">
      <span className="font-semibold tracking-wide text-accent">{label}</span>
      <div className="flex flex-wrap items-center gap-1 text-foreground-muted">
        {steps.map((step, idx) => (
          <span key={step} className="flex items-center gap-1">
            {idx > 0 && <ChevronRight className="size-3 text-foreground-subtle" />}
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}
