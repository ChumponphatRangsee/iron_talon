export default function MenuOverlay({ onStart }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(155deg,rgba(0,0,0,.94),rgba(8,18,4,.97))", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: ".45em", color: "#3a6020", marginBottom: 6, fontFamily: "monospace" }}>OPERATION</div>
        <div style={{ fontSize: 48, fontWeight: 900, color: "#a0cc60", letterSpacing: ".18em", textShadow: "0 0 50px rgba(120,190,50,.45),0 2px 0 #000", lineHeight: 1 }}>IRON TALON</div>
        <div style={{ fontSize: 9, color: "#2e4a1a", letterSpacing: ".3em", marginTop: 7 }}>TACTICAL BIRD'S-EYE COMBAT SIMULATOR</div>
      </div>
      <div style={{ width: 220, height: 1, background: "linear-gradient(to right,transparent,#587830,transparent)", marginBottom: 22 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 26, textAlign: "center" }}>
        {[["5", "WAVES"], ["5", "ENEMY TYPES"], ["3", "ABILITIES"], ["1", "DODGE ROLL"]].map(([n, l]) => (
          <div key={l} style={{ fontSize: 8, color: "#3a5020", letterSpacing: ".08em" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#7ab040", lineHeight: 1.1 }}>{n}</div>{l}
          </div>
        ))}
      </div>
      <button
        onClick={onStart}
        style={{ padding: "13px 54px", background: "linear-gradient(135deg,#1e3410,#2c4c18)", border: "1.5px solid #6a9838", borderRadius: 9, color: "#a8cc58", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: ".15em", boxShadow: "0 0 28px rgba(80,150,30,.25)", marginBottom: 20 }}
      >
        START MISSION
      </button>
      <div style={{ fontSize: 8, color: "#283818", textAlign: "center", lineHeight: 2.8, letterSpacing: ".07em" }}>
        WASD/ARROWS move . Mouse aim . LMB/SPACE fire . SHIFT dodge roll<br />G grenade . Q airstrike . F drone scan
      </div>
    </div>
  );
}
