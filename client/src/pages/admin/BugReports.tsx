import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  open:      { bg: "#1c1100", color: "#fbbf24" },
  reviewing: { bg: "#0a1929", color: "#60a5fa" },
  resolved:  { bg: "#052e16", color: "#4ade80" },
  dismissed: { bg: "#1a1a1a", color: "#555" },
};

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug", payment: "Payment", account: "Account", game: "Game Issue", other: "Other",
};

export default function BugReports() {
  const [status, setStatus] = useState("open");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [xpInput, setXpInput] = useState("2000");
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.admin.getBugReports.useQuery(
    { page, limit: 50, status: status === "all" ? undefined : status },
    { keepPreviousData: true },
  );

  const resolveMutation = trpc.admin.resolveBugReport.useMutation({
    onSuccess: () => utils.admin.getBugReports.invalidate(),
  });

  const awardXpMutation = trpc.admin.awardBugXp.useMutation({
    onSuccess: () => utils.admin.getBugReports.invalidate(),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 50);
  const expandedRow = data?.rows.find(r => r.id === expanded);

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0", margin: 0 }}>Bug Reports</h1>
          <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{data?.total ?? 0} reports</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["open", "reviewing", "resolved", "dismissed", "all"].map(s => (
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
              {["#", "User", "Category", "Title", "Date", "Status", "XP", "Actions"].map(h => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={8} style={{ padding: 28, textAlign: "center", color: "#555" }}>Loading…</td></tr>}
            {data?.rows.map((row, i) => (
              <>
                <tr key={row.id} style={{ borderTop: "1px solid #1e1e1e", background: i % 2 === 0 ? "#161616" : "#1a1a1a", cursor: "pointer" }}
                  onClick={() => setExpanded(expanded === row.id ? null : row.id)}>
                  <td style={{ padding: "9px 14px", color: "#555" }}>{row.id}</td>
                  <td style={{ padding: "9px 14px" }}>
                    <div style={{ fontWeight: 700, color: "#f0f0f0" }}>{row.username}</div>
                    <div style={{ fontSize: 11, color: "#555" }}>{row.email}</div>
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#1a1a1a", color: "#888", border: "1px solid #252525" }}>
                      {CATEGORY_LABELS[row.category] ?? row.category}
                    </span>
                  </td>
                  <td style={{ padding: "9px 14px", color: "#f0f0f0", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.title}</td>
                  <td style={{ padding: "9px 14px", color: "#555", whiteSpace: "nowrap" }}>
                    {new Date(row.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, ...STATUS_COLORS[row.status] }}>
                      {row.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "9px 14px", color: row.xpAwarded > 0 ? "#4ade80" : "#555", fontWeight: row.xpAwarded > 0 ? 700 : 400 }}>
                    {row.xpAwarded > 0 ? `+${row.xpAwarded} XP` : "—"}
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{ fontSize: 11, color: "#555" }}>{expanded === row.id ? "▲ hide" : "▼ view"}</span>
                  </td>
                </tr>

                {/* Expanded detail row */}
                {expanded === row.id && expandedRow && (
                  <tr key={`${row.id}-detail`} style={{ borderTop: "1px solid #1e1e1e" }}>
                    <td colSpan={8} style={{ padding: "20px 24px", background: "#111" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

                        {/* Left: description + attachments */}
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 1, marginBottom: 8 }}>DESCRIPTION</div>
                          <p style={{ fontSize: 13, color: "#ccc", lineHeight: 1.7, margin: "0 0 16px", whiteSpace: "pre-wrap" }}>{expandedRow.description}</p>

                          {expandedRow.videoUrl && (
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 1, marginBottom: 6 }}>VIDEO LINK</div>
                              <a href={expandedRow.videoUrl} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: 13, color: "#60a5fa", wordBreak: "break-all" }}>
                                {expandedRow.videoUrl}
                              </a>
                            </div>
                          )}

                          {expandedRow.attachments.length > 0 && (
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 1, marginBottom: 8 }}>
                                SCREENSHOTS ({expandedRow.attachments.length})
                              </div>
                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                {expandedRow.attachments.map((src, idx) => (
                                  <a key={idx} href={src} target="_blank" rel="noopener noreferrer">
                                    <img src={src} alt={`screenshot ${idx + 1}`} style={{
                                      width: 140, height: 100, objectFit: "cover",
                                      borderRadius: 8, border: "1px solid #252525", cursor: "zoom-in",
                                    }} />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right: admin actions */}
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 1, marginBottom: 10 }}>ADMIN ACTIONS</div>

                          {/* Status buttons */}
                          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                            {(["reviewing", "resolved", "dismissed"] as const).map(s => (
                              <button key={s} onClick={() => resolveMutation.mutate({ id: row.id, status: s, adminNote: noteInput || undefined })}
                                disabled={row.status === s}
                                style={{
                                  padding: "6px 14px", borderRadius: 7, border: "none", cursor: row.status === s ? "not-allowed" : "pointer",
                                  background: row.status === s ? "#1a1a1a" : STATUS_COLORS[s].bg,
                                  color: row.status === s ? "#333" : STATUS_COLORS[s].color,
                                  fontSize: 12, fontWeight: 700, textTransform: "capitalize",
                                }}>
                                Mark {s}
                              </button>
                            ))}
                          </div>

                          {/* Admin note */}
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 1, marginBottom: 6 }}>ADMIN NOTE</div>
                            {expandedRow.adminNote && (
                              <p style={{ fontSize: 12, color: "#888", marginBottom: 8, fontStyle: "italic" }}>Current: {expandedRow.adminNote}</p>
                            )}
                            <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)}
                              placeholder="Add a note visible to you only…"
                              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #252525", fontSize: 13, color: "#f0f0f0", background: "#1a1a1a", outline: "none", resize: "vertical", minHeight: 70, boxSizing: "border-box" }} />
                          </div>

                          {/* Award XP */}
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: 1, marginBottom: 6 }}>AWARD XP TO USER</div>
                            {expandedRow.xpAwarded > 0 ? (
                              <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 700 }}>✓ {expandedRow.xpAwarded} XP already awarded</div>
                            ) : (
                              <div style={{ display: "flex", gap: 8 }}>
                                <input type="number" value={xpInput} onChange={e => setXpInput(e.target.value)}
                                  style={{ width: 100, padding: "8px 10px", borderRadius: 7, border: "1.5px solid #252525", fontSize: 13, color: "#f0f0f0", background: "#1a1a1a", outline: "none" }} />
                                <button onClick={() => awardXpMutation.mutate({ id: row.id, xpAmount: parseInt(xpInput) })}
                                  style={{ padding: "8px 16px", borderRadius: 7, border: "none", background: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                                  Award XP
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {!isLoading && data?.rows.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 28, textAlign: "center", color: "#555" }}>No reports found</td></tr>
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
