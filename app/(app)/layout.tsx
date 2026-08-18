import { DataLoader } from "@/components/auth/data-loader";
import { BottomNav } from "@/components/nav/bottom-nav";

// Every page here is per-user, auth-gated data — never statically prerendered.
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataLoader>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col pb-24">
        {children}
      </div>
      <BottomNav />
    </DataLoader>
  );
}
