import { DataLoader } from "@/components/auth/data-loader";
import { LockGate } from "@/components/auth/lock-gate";
import { BottomNav } from "@/components/nav/bottom-nav";
import { OfflineSync } from "@/components/pwa/offline-sync";

// Every page here is per-user, auth-gated data — never statically prerendered.
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LockGate>
      <DataLoader>
        <OfflineSync />
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col pb-24">
          {children}
        </div>
        <BottomNav />
      </DataLoader>
    </LockGate>
  );
}
