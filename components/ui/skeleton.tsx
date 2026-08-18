import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-radius bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
