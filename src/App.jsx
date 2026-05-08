import { useEffect, useRef, useState } from "react";
import { createGameRuntime, createInitialUiState, WAVES } from "./game/runtime";
import PlayingHud from "./ui/PlayingHud";
import MenuOverlay from "./ui/MenuOverlay";
import GameOverOverlay from "./ui/GameOverOverlay";
import VictoryOverlay from "./ui/VictoryOverlay";

export default function App() {
  const mountRef = useRef(null);
  const runtimeRef = useRef(null);
  const [ui, setUi] = useState(createInitialUiState);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = () => {
      const runtime = createGameRuntime({ mountRef, setUi });
      runtimeRef.current = runtime;
      runtime.start();
    };
    document.head.appendChild(script);

    return () => {
      if (runtimeRef.current) runtimeRef.current.dispose();
      runtimeRef.current = null;
      script.remove();
    };
  }, []);

  const actions = {
    dodge: () => runtimeRef.current?.actions.dodge(),
    throwGrenade: () => runtimeRef.current?.actions.throwGrenade(),
    callAirstrike: () => runtimeRef.current?.actions.callAirstrike(),
    callDrone: () => runtimeRef.current?.actions.callDrone(),
    restart: () => runtimeRef.current?.actions.restart(),
    startMission: () => runtimeRef.current?.actions.startMission(),
  };

  return (
    <div style={{ fontFamily: "'Courier New',monospace", background: "#080b06", borderRadius: 14, overflow: "hidden", userSelect: "none", position: "relative", boxShadow: "0 0 60px rgba(0,0,0,.9)" }}>
      <div ref={mountRef} style={{ width: "100%", height: 510, position: "relative" }}>
        {ui.flash && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: "inset 0 0 110px 55px rgba(210,15,15,.8)", zIndex: 10, borderRadius: 14, transition: "opacity .1s" }} />}
        {ui.dodging && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: "inset 0 0 60px 20px rgba(80,200,255,.2)", zIndex: 8, borderRadius: 14 }} />}
        {!ui.droneReady && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "repeating-linear-gradient(transparent,transparent 3px,rgba(0,255,100,.03) 4px)", zIndex: 5 }} />}

        {ui.state === "playing" && <PlayingHud ui={ui} waveCount={WAVES.length} actions={actions} />}
        {ui.state === "menu" && <MenuOverlay onStart={actions.startMission} />}
        {ui.state === "over" && <GameOverOverlay ui={ui} waveCount={WAVES.length} onRetry={actions.restart} />}
        {ui.state === "win" && <VictoryOverlay ui={ui} waveCount={WAVES.length} onPlayAgain={actions.restart} />}
      </div>
    </div>
  );
}
