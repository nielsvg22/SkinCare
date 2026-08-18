"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LineChart, Package, Settings, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Vandaag", icon: Sun },
  { href: "/week", label: "Week", icon: CalendarDays },
  { href: "/products", label: "Producten", icon: Package },
  { href: "/progress", label: "Progressie", icon: LineChart },
  { href: "/settings", label: "Instellingen", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 backdrop-blur-md"
      aria-label="Hoofdnavigatie"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className="flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] transition-colors"
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "size-[22px] transition-colors",
                    active ? "text-accent" : "text-foreground-subtle"
                  )}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span
                  className={cn(
                    "text-[10.5px] font-medium transition-colors",
                    active ? "text-accent" : "text-foreground-subtle"
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
