"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, SunMoon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHasMounted } from "@/lib/hooks/useHasMounted";

const OPTIONS = [
  { value: "light", label: "Licht", icon: Sun },
  { value: "system", label: "Systeem", icon: SunMoon },
  { value: "dark", label: "Donker", icon: Moon },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const mounted = useHasMounted();

  return (
    <div className="flex gap-1 rounded-radius bg-muted p-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={cn(
            "flex items-center gap-1.5 rounded-radius-sm px-3 py-1.5 text-xs font-medium transition-colors",
            mounted && theme === value
              ? "bg-surface text-foreground shadow-soft-sm"
              : "text-foreground-muted"
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
