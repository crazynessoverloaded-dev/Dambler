import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import MainLayout from "@/components/MainLayout";
import { Mail, Twitter, Send, Bug, Upload, X, Lock, MessageCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 14,
  padding: "22px 24px",
};
const ol: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)",
  textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12,
};
const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10,
  padding: "11px 14px", fontSize: 13.5, color: "#fff",
  outline: "none", boxSizing: "border-box",
};

const CHANNELS = [
  { icon: Mail,    label: "Email Support", desc: "support@dambler.io — we reply within a few hours.", action: "Send Email" },
  { icon: Twitter, label: "Twitter / X",   desc: "DM us @DamblerHQ for quick questions.",             action: "Follow Us" },
];

const CATEGORIES = [
  { value: "bug",     label: "Bug / Glitch" },
  { value: "payment", label: "Payment Issue" },
  { value: "account", label: "Account Problem" },
  { value: "game",    label: "Game Issue" },
  { value: "other",   label: "Other" },
];

function BugReportForm() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("bug");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const submitMutation = trpc.bugReport.submit.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(err.message),
  });

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = 3 - attachments.length;
    Array.from(files).slice(0, remaining).forEach(file => {
      if (file.size > 2 * 1024 * 1024) { setError(`${file.name} is over 2MB`); return; }
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        setAttachments(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeAttachment(idx: number) {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (title.length < 5) { setError("Title must be at least 5 characters."); return; }
    if (description.length < 20) { setError("Description must be at least 20 characters."); return; }
    submitMutation.mutate({ title, category: category as any, description, attachments, videoUrl: videoUrl || undefined });
  }

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ ...card, textAlign: "center", padding: "48px 32px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 10 }}>Report Submitted!</h3>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: "0 auto 20px", maxWidth: 360 }}>
          Thanks for helping make Dambler better. Our team will review your report and you'll receive <strong style={{ color: "#4ade80" }}>2000 XP</strong> once it's verified.
        </p>
        <button onClick={() => { setSubmitted(false); setTitle(""); setDescription(""); setAttachments([]); setVideoUrl(""); }}
          style={{ padding: "10px 24px", borderRadius: 9, background: "#fff", color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
          Submit Another
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} style={card}>
      {/* Pre-filled user info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>Username</p>
          <input style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} value={user?.username ?? ""} readOnly />
        </div>
        <div>
          <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>Email</p>
          <input style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} value={user?.email ?? ""} readOnly />
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>Category</p>
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value} style={{ background: "#1a1a1a" }}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>Title</p>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief summary of the issue"
              style={inputStyle} />
          </div>
        </div>

        <div>
          <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>
            Description <span style={{ color: "rgba(255,255,255,0.2)" }}>— be as detailed as possible</span>
          </p>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Steps to reproduce, what happened, what you expected…"
            style={{ ...inputStyle, resize: "vertical", minHeight: 110, fontFamily: "inherit" }} />
        </div>

        <div>
          <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>
            Video Link <span style={{ color: "rgba(255,255,255,0.2)" }}>— optional (YouTube, Loom, Google Drive)</span>
          </p>
          <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..."
            style={inputStyle} />
        </div>

        <div>
          <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 8, fontWeight: 600 }}>
            Screenshots <span style={{ color: "rgba(255,255,255,0.2)" }}>— up to 3 images, max 2MB each</span>
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
            {attachments.map((src, idx) => (
              <div key={idx} style={{ position: "relative" }}>
                <img src={src} alt={`attachment ${idx + 1}`} style={{ width: 90, height: 68, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }} />
                <button type="button" onClick={() => removeAttachment(idx)}
                  style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#ef4444", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X style={{ width: 10, height: 10, color: "#fff" }} />
                </button>
              </div>
            ))}
            {attachments.length < 3 && (
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ width: 90, height: 68, borderRadius: 8, border: "1px dashed rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.03)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <Upload style={{ width: 14, height: 14, color: "rgba(255,255,255,0.3)" }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Add</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
            onChange={e => handleFiles(e.target.files)} />
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171" }}>{error}</div>
        )}

        <div style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🎁</span>
          <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Verified bug reports earn you <strong style={{ color: "#4ade80" }}>2000 XP</strong> — awarded manually by our team after review.
          </p>
        </div>

        <button type="submit" disabled={submitMutation.isPending}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#fff", color: "#000", fontWeight: 800, fontSize: 13, padding: "12px", borderRadius: 10, border: "none", cursor: "pointer", opacity: submitMutation.isPending ? 0.6 : 1 }}>
          <Send style={{ width: 13, height: 13 }} />
          {submitMutation.isPending ? "Submitting…" : "Submit Bug Report"}
        </button>
      </form>
    </motion.div>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(err.message),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ ...card, textAlign: "center", padding: "48px 24px" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Message Sent!</h3>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: "0 auto" }}>
          We'll get back to you at <strong style={{ color: "#fff" }}>{form.email}</strong> within a few hours.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
      style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>First Name</p>
          <input style={inputStyle} placeholder="Alex" value={form.firstName} onChange={set("firstName")} />
        </div>
        <div>
          <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>Last Name</p>
          <input style={inputStyle} placeholder="Smith" value={form.lastName} onChange={set("lastName")} />
        </div>
      </div>
      <div>
        <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>Email</p>
        <input style={inputStyle} placeholder="you@email.com" type="email" value={form.email} onChange={set("email")} />
      </div>
      <div>
        <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>Subject</p>
        <input style={inputStyle} placeholder="How can we help?" value={form.subject} onChange={set("subject")} />
      </div>
      <div>
        <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>Message</p>
        <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 100, fontFamily: "inherit" }}
          placeholder="Describe your issue or question..." value={form.message} onChange={set("message")} />
      </div>
      {error && <div style={{ fontSize: 12, color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
      <button onClick={() => { setError(""); submitMutation.mutate(form); }}
        disabled={submitMutation.isPending}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#fff", color: "#0c0e14", fontWeight: 800, fontSize: 13, padding: "12px", borderRadius: 10, border: "none", cursor: "pointer", width: "100%", opacity: submitMutation.isPending ? 0.6 : 1 }}>
        <Send style={{ width: 13, height: 13 }} /> {submitMutation.isPending ? "Sending…" : "Send Message"}
      </button>
    </motion.div>
  );
}

export default function Contact() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<"contact" | "bug">("contact");

  return (
    <MainLayout>
      <div style={{ background: "#0f1118", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "52px 24px 80px" }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36, maxWidth: 520 }}>
            <p style={ol}>Get in Touch</p>
            <h1 style={{ fontSize: 40, fontWeight: 800, color: "#fff", letterSpacing: -1, margin: "0 0 14px", lineHeight: 1.12, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              We're here<br />to help.
            </h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.44)", lineHeight: 1.7, margin: 0 }}>
              Contact support or report a bug — verified bug reports earn <strong style={{ color: "#4ade80" }}>2000 XP</strong>.
            </p>
          </motion.div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
            {([
              { key: "contact", label: "Contact Support", icon: MessageCircle },
              { key: "bug",     label: "Report a Bug",    icon: Bug },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 18px", borderRadius: 9, border: "1px solid",
                borderColor: tab === key ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
                background: tab === key ? "rgba(255,255,255,0.08)" : "transparent",
                color: tab === key ? "#fff" : "rgba(255,255,255,0.38)",
                fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.18s",
              }}>
                <Icon style={{ width: 13, height: 13 }} />
                {label}
              </button>
            ))}
          </div>

          {tab === "contact" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
              <div>
                <p style={ol}>Send a Message</p>
                <ContactForm />
              </div>

              <div>
                <p style={ol}>Other Ways to Reach Us</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {CHANNELS.map((c, i) => { const Icon = c.icon; return (
                    <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.07 }}
                      style={{ ...card, display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 10, display: "flex", flexShrink: 0 }}>
                        <Icon style={{ width: 16, height: 16, color: "rgba(255,255,255,0.52)" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 3px" }}>{c.label}</p>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", margin: 0, lineHeight: 1.5 }}>{c.desc}</p>
                      </div>
                      <button style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "6px 12px", cursor: "pointer", whiteSpace: "nowrap" }}>{c.action}</button>
                    </motion.div>
                  ); })}
                </div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ ...card, marginTop: 10 }}>
                  <p style={ol}>Response Times</p>
                  {[["Live Chat", "Under 2 minutes"], ["Email", "2 – 4 hours"], ["Twitter / X", "Same day"]].map(([ch, rt], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{ch}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{rt}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          )}

          {tab === "bug" && (
            <div style={{ maxWidth: 640 }}>
              <p style={ol}>Report a Bug</p>
              {!isAuthenticated ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...card, textAlign: "center", padding: "48px 32px" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Lock style={{ width: 20, height: 20, color: "rgba(255,255,255,0.3)" }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Login Required</h3>
                  <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.38)", marginBottom: 24, lineHeight: 1.6 }}>
                    You need to be logged in to submit a bug report.<br />Verified reports earn <strong style={{ color: "#4ade80" }}>2000 XP</strong>.
                  </p>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <Link href="/login">
                      <button style={{ padding: "10px 24px", borderRadius: 9, background: "#fff", color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                        Login
                      </button>
                    </Link>
                    <Link href="/register">
                      <button style={{ padding: "10px 24px", borderRadius: 9, background: "transparent", color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 13, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer" }}>
                        Create Account
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <BugReportForm />
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
