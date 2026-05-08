export default function GameOverOverlay({ ui, waveCount, onRetry }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(155deg,rgba(0,0,0,.92),rgba(18,4,4,.97))", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
      <div style={{ fontSize: 9, letterSpacing: ".45em", color: "#6a1818", marginBottom: 2, fontFamily: "monospace" }}>CLASSIFIED . KIA</div>
      <div style={{ fontSize: 40, fontWeight: 900, color: "#cc2828", letterSpacing: ".12em", textShadow: "0 0 40px rgba(200,30,30,.55)" }}>MISSION FAILED</div>
      <div style={{ width: 180, height: 1, background: "linear-gradient(to right,transparent,#7a1a1a,transparent)", margin: "4px 0" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, fontSize: 9, color: "#4a2020", textAlign: "center", letterSpacing: ".08em", marginBottom: 10 }}>
        {[["score", ui.score.toLocaleString(), "#fff"], ["kills", ui.kills, "#e09030"], ["wave", `${ui.wave + 1}/${waveCount}`, "#886688"]].map(([l, v, c]) => (
          <div key={l}><div style={{ fontSize: 22, fontWeight: 700, color: c, lineHeight: 1.1 }}>{v}</div>{String(l).toUpperCase()}</div>
        ))}
      </div>
      <button onClick={onRetry} style={{ padding: "12px 42px", background: "linear-gradient(135deg,#380d0d,#521818)", border: "1.5px solid #bb2828", borderRadius: 9, color: "#e87878", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: ".13em" }}>
        RETRY MISSION
      </button>
    </div>
  );
}
