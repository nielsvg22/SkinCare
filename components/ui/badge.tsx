import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-radius-full border px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-muted text-foreground-muted",
        blue: "border-transparent bg-blue-50 text-blue-600",
        green: "border-transparent bg-green-50 text-green-600",
        beige: "border-transparent bg-beige-50 text-navy-500",
        orange: "border-transparent bg-orange-400/15 text-orange-600",
        outline: "border-border-strong text-foreground-muted",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
