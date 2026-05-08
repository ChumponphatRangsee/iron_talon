export default function VictoryOverlay({ ui, waveCount, onPlayAgain }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(155deg,rgba(0,0,0,.92),rgba(4,14,2,.97))", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
      <div style={{ fontSize: 9, letterSpacing: ".45em", color: "#3a6018", marginBottom: 2, fontFamily: "monospace" }}>OPERATION COMPLETE</div>
      <div style={{ fontSize: 40, fontWeight: 900, color: "#88cc38", letterSpacing: ".15em", textShadow: "0 0 50px rgba(100,190,40,.55)" }}>VICTORY</div>
      <div style={{ width: 220, height: 1, background: "linear-gradient(to right,transparent,#508028,transparent)", margin: "4px 0" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, fontSize: 9, color: "#304820", textAlign: "center", letterSpacing: ".08em", marginBottom: 10 }}>
        {[["score", ui.score.toLocaleString(), "#fff"], ["kills", ui.kills, "#e8b030"], ["waves", waveCount, "#88cc38"]].map(([l, v, c]) => (
          <div key={l}><div style={{ fontSize: 22, fontWeight: 700, color: c, lineHeight: 1.1 }}>{v}</div>{String(l).toUpperCase()}</div>
        ))}
      </div>
      <button onClick={onPlayAgain} style={{ padding: "12px 42px", background: "linear-gradient(135deg,#182a0c,#243c12)", border: "1.5px solid #6a9430", borderRadius: 9, color: "#a0c850", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: ".13em" }}>
        PLAY AGAIN
      </button>
    </div>
  );
}
