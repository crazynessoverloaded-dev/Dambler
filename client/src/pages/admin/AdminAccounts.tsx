import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";

export default function AdminAccounts() {
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery();
  const { data, isLoading } = trpc.admin.getAdmins.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const createMutation = trpc.admin.createAdmin.useMutation({
    onSuccess: () => {
      utils.admin.getAdmins.invalidate();
      setShowForm(false);
      setForm({ username: "", email: "", password: "" });
      setSuccess("Admin account created.");
    },
    onError: (err) => setError(err.message),
  });

  const removeMutation = trpc.admin.removeAdmin.useMutation({
    onSuccess: () => {
      utils.admin.getAdmins.invalidate();
      setSuccess("Admin access removed.");
    },
    onError: (err) => setError(err.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    createMutation.mutate(form);
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 }}>Admin Accounts</h1>
          <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{data?.length ?? 0} admin accounts</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#1e293b", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + New Admin
        </button>
      </div>

      {(error || success) && (
        <div style={{ background: error ? "#fef2f2" : "#f0fdf4", border: `1px solid ${error ? "#fecaca" : "#bbf7d0"}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: error ? "#dc2626" : "#16a34a" }}>
          {error || success}
          <button onClick={() => { setError(""); setSuccess(""); }} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "inherit" }}>×</button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "22px 24px", marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: "0 0 16px" }}>Create Admin Account</h3>
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
            {[
              { label: "Username", key: "username", type: "text", placeholder: "admin_name" },
              { label: "Email", key: "email", type: "email", placeholder: "admin@dambler.com" },
              { label: "Password", key: "password", type: "password", placeholder: "Min 8 chars" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 5 }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder}
                  value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: "100%", padding: "9px 11px", borderRadius: 7, border: "1.5px solid #d1d5db", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <button type="submit" disabled={createMutation.isPending}
              style={{ padding: "9px 18px", borderRadius: 7, border: "none", background: "#1e293b", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", height: 38 }}>
              Create
            </button>
          </form>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["ID", "Username", "Email", "Created", "Last Sign In", "Actions"].map(h => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} style={{ padding: 28, textAlign: "center", color: "#94a3b8" }}>Loading…</td></tr>}
            {data?.map((admin, i) => {
              const isMe = admin.id === meQuery.data?.id;
              return (
                <tr key={admin.id} style={{ borderTop: "1px solid #f1f5f9", background: isMe ? "#f0f9ff" : i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "9px 14px", color: "#94a3b8" }}>{admin.id}</td>
                  <td style={{ padding: "9px 14px", fontWeight: 700, color: "#1e293b" }}>
                    {admin.username} {isMe && <span style={{ fontSize: 10, color: "#0369a1", fontWeight: 600 }}>(you)</span>}
                  </td>
                  <td style={{ padding: "9px 14px", color: "#475569" }}>{admin.email}</td>
                  <td style={{ padding: "9px 14px", color: "#94a3b8" }}>
                    {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                  </td>
                  <td style={{ padding: "9px 14px", color: "#94a3b8" }}>
                    {admin.lastSignedIn ? new Date(admin.lastSignedIn).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    {!isMe && (
                      <button onClick={() => { if (confirm(`Remove admin access from ${admin.username}?`)) removeMutation.mutate({ userId: admin.id }); }}
                        style={{ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: "#fee2e2", color: "#dc2626", fontWeight: 700, fontSize: 11 }}>
                        Remove Access
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
