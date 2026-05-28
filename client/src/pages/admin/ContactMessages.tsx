import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  new:      { bg: "#1c1100", color: "#fbbf24" },
  read:     { bg: "#0a1929", color: "#60a5fa" },
  resolved: { bg: "#052e16", color: "#4ade80" },
};

export default function ContactMessages() {
  const [status, setStatus] = useState("new");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.getContactSubmissions.useQuery(
    { page, limit: 50, status: status === "all" ? undefined : status },
    { keepPreviousData: true, refetchInterval: 30_000 },
  );

  const updateMutation = trpc.admin.updateContactStatus.useMutation({
    onSuccess: () => utils.admin.getContactSubmissions.invalidate(),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 50);

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0", margin: 0 }}>Contact Messages</h1>
          <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{data?.total ?? 0} messages</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["new", "read", "resolved", "all"].map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }} style={{
              padding: "6px 14px", borderRadius: 7, border: "1px solid",
              borderColor: status === s ? "#fff" : "#252525",
              background: status === s ? "#fff" : "#1a1a1a",
              color: status === s ? "#000" : "#888",
              fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
            }}>{s}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "#161616", borderRadius: 12, border: "1px solid #222", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#111" }}>
              {["#", "Name", "Email", "Subject", "Date", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} style={{ padding: 28, textAlign: "center", color: "#555" }}>Loading…</td></tr>}
            {data?.rows.map((row, i) => (
              <>
                <tr key={row.id} style={{ borderTop: "1px solid #1e1e1e", background: i % 2 === 0 ? "#161616" : "#1a1a1a", cursor: "pointer" }}
                  onClick={() => {
                    setExpanded(expanded === row.id ? null : row.id);
                    if (row.status === "new") updateMutation.mutate({ id: row.id, status: "read" });
                  }}>
                  <td style={{ padding: "9px 14px", color: "#555" }}>{row.id}</td>
                  <td style={{ padding: "9px 14px", fontWeight: 700, color: "#f0f0f0" }}>{row.firstName} {row.lastName}</td>
                  <td style={{ padding: "9px 14px", color: "#888" }}>{row.email}</td>
                  <td style={{ padding: "9px 14px", color: "#f0f0f0", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.subject}</td>
                  <td style={{ padding: "9px 14px", color: "#555", whiteSpace: "nowrap" }}>
                    {new Date(row.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, ...STATUS_COLORS[row.status] }}>
                      {row.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{ fontSize: 11, color: "#555" }}>{expanded === row.id ? "▲ hide" : "▼ view"}</span>
                  </td>
                </tr>

                {expanded === row.id && (
                  <tr key={`${row.id}-detail`} style={{ borderTop: "1px solid #1e1e1e" }}>
                    <td colSpan={7} style={{ padding: "20px 24px", background: "#111" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 1, marginBottom: 8 }}>MESSAGE</div>
                          <p style={{ fontSize: 13, color: "#ccc", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{row.message}</p>
                          <div style={{ marginTop: 12 }}>
                            <a href={`mailto:${row.email}?subject=Re: ${row.subject}`}
                              style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none", fontWeight: 600 }}>
                              ✉ Reply to {row.email}
                            </a>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 140 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 1, marginBottom: 4 }}>MARK AS</div>
                          {(["read", "resolved"] as const).map(s => (
                            <button key={s} onClick={() => updateMutation.mutate({ id: row.id, status: s })}
                              disabled={row.status === s}
                              style={{
                                padding: "7px 14px", borderRadius: 7, border: "none", cursor: row.status === s ? "not-allowed" : "pointer",
                                background: row.status === s ? "#1a1a1a" : STATUS_COLORS[s].bg,
                                color: row.status === s ? "#333" : STATUS_COLORS[s].color,
                                fontSize: 12, fontWeight: 700, textTransform: "capitalize",
                              }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {!isLoading && data?.rows.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 28, textAlign: "center", color: "#555" }}>No messages found</td></tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #222", display: "flex", gap: 8, alignItems: "center" }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #252525", background: "#1a1a1a", color: page === 1 ? "#333" : "#888", fontSize: 13, fontWeight: 600, cursor: page === 1 ? "not-allowed" : "pointer" }}>
              ← Prev
            </button>
            <span style={{ fontSize: 13, color: "#555" }}>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid #252525", background: "#1a1a1a", color: page === totalPages ? "#333" : "#888", fontSize: 13, fontWeight: 600, cursor: page === totalPages ? "not-allowed" : "pointer" }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
