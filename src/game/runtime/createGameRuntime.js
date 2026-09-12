import { initGame } from "../engine";
import { disposeRuntime } from "../loop/disposeRuntime";
import { createRuntimeActions } from "../player/actions";
import { createTimerRegistry } from "./createTimerRegistry";

export function createGameRuntime({ mountRef, setUi, config = {} }) {
  const gameState = { config, timers: createTimerRegistry() };
  const actions = createRuntimeActions(gameState, setUi);
  let started = false;

  return {
    actions,
    start() {
      if (started) return;
      started = true;
      initGame(mountRef, gameState, setUi);
      gameState._canvasEl = gameState.renderer?.domElement || null;
    },
    dispose() {
      disposeRuntime(gameState, mountRef);
      started = false;
    },
  };
}
