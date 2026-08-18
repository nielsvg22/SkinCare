import { Flame } from "lucide-react";

interface StreakFooterProps {
  current: number;
  message?: string;
}

export function StreakFooter({ current, message }: StreakFooterProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-5 py-6 text-center">
      {current > 0 && (
        <div className="flex items-center gap-1.5 rounded-radius-full bg-orange-400/12 px-3.5 py-1.5 text-sm font-medium text-orange-600">
          <Flame className="size-4" fill="currentColor" strokeWidth={0} />
          {current} {current === 1 ? "dag" : "dagen"} consistent
        </div>
      )}
      {message && <p className="max-w-xs text-sm text-foreground-muted">{message}</p>}
    </div>
  );
}
