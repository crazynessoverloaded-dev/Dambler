import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "./AdminLayout";

const ALL_GAMES = [
  "crash","blackjack","roulette","plinko","mines","baccarat","dice","hilo","keno",
  "scratch-cards","video-poker","craps","sicbo","limbo","tower","coinflip","dragon-tiger",
  "guess-the-cup","wheel","three-card-poker","casino-war","slot-joker","classic-slots",
  "lucky-7","card-flip","penalty","jackpot-box","parity","color-spin","bigsix","red-dog",
  "chuck-a-luck","andar-bahar","pontoon","caribbean-stud","casino-holdem","lightning-dice",
  "bingo","rps","dice-21","dice-duel","hot-dice","number-match","rapid-roulette",
];

export default function SiteConfig() {
  const utils = trpc.useUtils();
  const { data: cfg } = trpc.admin.getSiteConfig.useQuery();
  const { data: toggles } = trpc.admin.getGameToggles.useQuery();
  const setCfg = trpc.admin.setSiteConfig.useMutation({ onSuccess: () => utils.admin.getSiteConfig.invalidate() });
  const setToggle = trpc.admin.setGameToggle.useMutation({ onSuccess: () => utils.admin.getGameToggles.invalidate() });

  const [announcement, setAnnouncement] = useState("");
  const [savedAnnouncement, setSavedAnnouncement] = useState(false);

  const maintenance = cfg?.["maintenance_mode"] === "1";
  const currentAnnouncement = cfg?.["announcement"] ?? "";

  function toggleMaintenance() {
    setCfg.mutate({ key: "maintenance_mode", value: maintenance ? "0" : "1" });
  }

  function saveAnnouncement() {
    setCfg.mutate({ key: "announcement", value: announcement }, {
      onSuccess: () => { setSavedAnnouncement(true); setTimeout(() => setSavedAnnouncement(false), 2000); setAnnouncement(""); },
    });
  }

  function clearAnnouncement() {
    setCfg.mutate({ key: "announcement", value: "" });
  }

  const gameEnabled = (id: string) => toggles?.[id] !== false;

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0", margin: 0 }}>Site Config</h1>
        <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>Maintenance mode, announcements, and game toggles</p>
      </div>

      {/* Maintenance mode */}
      <div style={{ background: "#161616", border: `1px solid ${maintenance ? "#3a0000" : "#222"}`, borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#f0f0f0", margin: "0 0 4px" }}>Maintenance Mode</p>
            <p style={{ fontSize: 12, color: "#555", margin: 0 }}>
              {maintenance ? "⚠ Site is in maintenance mode — users see a maintenance message." : "Site is live and accessible to players."}
            </p>
          </div>
          <button onClick={toggleMaintenance} disabled={setCfg.isPending}
            style={{
              padding: "10px 22px", borderRadius: 9, border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer",
              background: maintenance ? "#fff" : "#1a0000",
              color: maintenance ? "#111" : "#f87171",
            }}>
            {maintenance ? "Take Site Live" : "Enable Maintenance"}
          </button>
        </div>
      </div>

      {/* Announcement banner */}
      <div style={{ background: "#161616", border: "1px solid #222", borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: "#f0f0f0", marginBottom: 4 }}>Site-Wide Announcement</p>
        <p style={{ fontSize: 12, color: "#555", marginBottom: 12 }}>
          Current: <span style={{ color: currentAnnouncement ? "#f0f0f0" : "#444" }}>{currentAnnouncement || "None"}</span>
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={announcement} onChange={e => setAnnouncement(e.target.value)}
            placeholder="e.g. Scheduled maintenance tonight at 02:00 UTC"
            style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid #252525", background: "#1a1a1a", color: "#f0f0f0", fontSize: 13, outline: "none" }} />
          <button onClick={saveAnnouncement} disabled={!announcement.trim() || setCfg.isPending}
            style={{ padding: "9px 20px", borderRadius: 8, background: "#fff", color: "#111", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
            {savedAnnouncement ? "✓ Saved" : "Post"}
          </button>
          {currentAnnouncement && (
            <button onClick={clearAnnouncement}
              style={{ padding: "9px 16px", borderRadius: 8, background: "#1a0000", border: "1px solid #3a0000", color: "#f87171", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Game toggles */}
      <div style={{ background: "#161616", border: "1px solid #222", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e1e1e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", margin: 0 }}>Game Toggles</p>
          <p style={{ fontSize: 12, color: "#555", margin: 0 }}>
            {ALL_GAMES.filter(g => gameEnabled(g)).length} / {ALL_GAMES.length} enabled
          </p>
        </div>
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {ALL_GAMES.map(id => {
            const on = gameEnabled(id);
            return (
              <button key={id} onClick={() => setToggle.mutate({ gameId: id, enabled: !on })}
                style={{
                  padding: "10px 12px", borderRadius: 9, border: `1px solid ${on ? "#2a2a2a" : "#1e1e1e"}`,
                  background: on ? "#1e1e1e" : "#111",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: on ? "#f0f0f0" : "#444", textTransform: "capitalize" }}>
                  {id.replace(/-/g, " ")}
                </span>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: on ? "#4ade80" : "#333", flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
