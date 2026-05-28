import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function BannedUsers() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.getBannedUsers.useQuery({ page: 1, limit: 100 });

  const unbanMutation = trpc.admin.unbanUser.useMutation({
    onSuccess: () => utils.admin.getBannedUsers.invalidate(),
  });

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 }}>Banned Users</h1>
        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
          {data?.total ?? 0} banned accounts —{" "}
          <span style={{ fontWeight: 700, color: "#dc2626" }}>
            ${(data?.frozenTotal ?? 0).toFixed(2)} frozen
          </span>
        </p>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["ID", "Username", "Email", "Frozen Balance", "Ban Date", "Reason", "Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} style={{ padding: 28, textAlign: "center", color: "#94a3b8" }}>Loading…</td></tr>}
              {data?.rows.map((u, i) => (
                <tr key={u.id} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fff5f5" }}>
                  <td style={{ padding: "9px 14px", color: "#94a3b8" }}>{u.id}</td>
                  <td style={{ padding: "9px 14px", fontWeight: 700, color: "#dc2626" }}>{u.username}</td>
                  <td style={{ padding: "9px 14px", color: "#475569" }}>{u.email}</td>
                  <td style={{ padding: "9px 14px", fontWeight: 700, color: "#dc2626" }}>${Number(u.balance ?? 0).toFixed(2)}</td>
                  <td style={{ padding: "9px 14px", color: "#94a3b8" }}>{fmtDate(u.bannedAt)}</td>
                  <td style={{ padding: "9px 14px", color: "#475569", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.banReason ?? "—"}
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    <button
                      onClick={() => unbanMutation.mutate({ userId: u.id })}
                      style={{
                        padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                        background: "#f0fdf4", color: "#16a34a", fontWeight: 700, fontSize: 12,
                      }}>
                      Unban
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && data?.rows.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 28, textAlign: "center", color: "#94a3b8" }}>No banned users</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
