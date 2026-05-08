import AbilityBtn from "./AbilityBtn";

export default function PlayingHud({ ui, waveCount, actions }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "linear-gradient(to bottom,rgba(0,0,0,.8),transparent)" }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#8cc050", background: "rgba(25,48,8,.88)", padding: "3px 11px", borderRadius: 5, marginBottom: 4, display: "inline-flex", alignItems: "center", gap: 6, letterSpacing: ".14em", border: "1px solid rgba(100,170,40,.28)" }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#7cb840", boxShadow: "0 0 6px #7cb840" }} />
            WAVE {ui.wave + 1}/{waveCount} . {ui.waveLabel}
          </div>
          <div style={{ fontSize: 10, color: "#908e7e", letterSpacing: ".06em" }}>HOSTILES: <span style={{ color: "#f0b040", fontWeight: 700 }}>{ui.enemies}</span></div>
          <div style={{ fontSize: 9, color: "#4a5035", marginTop: 1, letterSpacing: ".04em" }}>{">"} {ui.obj}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1, letterSpacing: ".04em" }}>{ui.score.toLocaleString()}</div>
          <div style={{ fontSize: 8, color: "#444", letterSpacing: ".12em" }}>SCORE</div>
          {ui.combo > 1 && <div style={{ fontSize: 12, color: "#f0b040", fontWeight: 700, marginTop: 2 }}>x{ui.combo} COMBO</div>}
          <div style={{ fontSize: 8, color: "#7ab840", letterSpacing: ".05em", marginTop: 1 }}>KILLS: {ui.kills}</div>
        </div>
      </div>

      <div style={{ position: "absolute", top: 70, left: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 11, color: "#66bb33", width: 18 }}>HP</span>
          <div style={{ width: 100, height: 7, background: "rgba(255,255,255,.1)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${ui.hp}%`, height: "100%", background: ui.hp > 60 ? "#4a8818" : ui.hp > 30 ? "#a05510" : "#b81c1c", borderRadius: 4, transition: "width .12s" }} />
          </div>
          <span style={{ fontSize: 9, color: ui.hp < 30 ? "#e03030" : "#999", width: 26, fontWeight: 700 }}>{ui.hp}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 10, color: "#4488bb", width: 18 }}>ARM</span>
          <div style={{ width: 100, height: 5, background: "rgba(255,255,255,.1)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${ui.armor * 2}%`, height: "100%", background: "#3a6a99", borderRadius: 3, transition: "width .12s" }} />
          </div>
          <span style={{ fontSize: 9, color: "#666", width: 26 }}>{ui.armor}</span>
        </div>
        <div style={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap", maxWidth: 120 }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{ width: 3, height: 10, borderRadius: 1.5, background: i < ui.ammo ? "#e8a830" : "#1e1e14", transition: "background .08s" }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, color: ui.ammo < 8 ? "#e05030" : "#666", letterSpacing: ".05em" }}>{ui.ammo}/30</span>
          {ui.reloading && <span style={{ fontSize: 8, color: "#f0b040", letterSpacing: ".08em", fontWeight: 700 }}>RELOADING</span>}
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ width: 10, height: 16, borderRadius: 3, background: i < ui.grenades ? "#786010" : "#161606", border: "1px solid", borderColor: i < ui.grenades ? "#b09020" : "#252510" }} />
          ))}
          <span style={{ fontSize: 9, color: "#666", marginLeft: 2 }}>GRENADES</span>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 12, alignItems: "flex-end" }}>
        <AbilityBtn icon="D" hotkey="SHIFT" ready={!ui.dodging} color="80,200,255" onClick={actions.dodge} label="DODGE" />
        <AbilityBtn icon="G" hotkey="G" ready={ui.grenades > 0} color="200,160,40" onClick={actions.throwGrenade} label="GRENADE" />
        <AbilityBtn icon="A" hotkey="Q" ready={ui.airstrikeReady} color="255,110,30" onClick={actions.callAirstrike} label="AIRSTRIKE" />
        <AbilityBtn icon="R" hotkey="F" ready={ui.droneReady} color="60,200,110" onClick={actions.callDrone} label="DRONE" />
      </div>

      <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", fontSize: 8, color: "rgba(255,255,255,.18)", whiteSpace: "nowrap", letterSpacing: ".08em" }}>
        WASD move . LMB/SPACE fire . Mouse aim . SHIFT dodge . G grenade . Q airstrike . F drone
      </div>
    </div>
  );
}
