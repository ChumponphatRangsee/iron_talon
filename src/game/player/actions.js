export function createRuntimeActions(gameState, setUi) {
  return {
    dodge() {
      if (gameState.doDodge) gameState.doDodge();
    },
    throwGrenade() {
      if (gameState.throwGrenade) gameState.throwGrenade();
    },
    callAirstrike() {
      if (gameState.callAirstrike) gameState.callAirstrike();
    },
    callDrone() {
      if (gameState.callDrone) gameState.callDrone();
    },
    restart() {
      if (gameState.restart) gameState.restart();
    },
    startMission() {
      setUi((u) => ({ ...u, state: "playing" }));
      gameState.gameState = "playing";
      if (gameState.simulation) gameState.simulation.phase = "playing";
    },
  };
}
