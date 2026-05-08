export default function AbilityBtn({ icon, hotkey, ready, color, onClick, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }} onClick={onClick}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: ready ? `rgba(${color},.22)` : "rgba(20,20,20,.8)",
          border: `1.5px solid ${ready ? `rgb(${color})` : "#2a2a2a"}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          transition: "all .25s",
          boxShadow: ready ? `0 0 14px rgba(${color},.28)` : "none",
          pointerEvents: "auto",
        }}
      >
        <span style={{ fontSize: 18, filter: ready ? "none" : "grayscale(1) opacity(.35)" }}>{icon}</span>
        <span style={{ fontSize: 7, color: ready ? `rgb(${color})` : "#333", letterSpacing: ".07em", fontFamily: "monospace" }}>[{hotkey}]</span>
      </div>
      <span style={{ fontSize: 8, color: "#444", letterSpacing: ".06em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}
