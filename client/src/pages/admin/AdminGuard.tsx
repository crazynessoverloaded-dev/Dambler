import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import type { ReactNode } from "react";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { data: me, isLoading } = trpc.auth.me.useQuery();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
        <div style={{ color: "#94a3b8", fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (!me || me.role !== "admin") {
    setLocation("/admin");
    return null;
  }

  return <>{children}</>;
}
