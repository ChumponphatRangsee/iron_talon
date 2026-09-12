import { disposeInputBindings } from "../input/disposeInput";

export function disposeRuntime(gameState, mountRef) {
  if (gameState.animId) cancelAnimationFrame(gameState.animId);
  gameState.timers?.reset();
  disposeInputBindings(gameState);
  if (gameState.renderer) {
    if (gameState.renderer.domElement?.parentNode) {
      gameState.renderer.domElement.parentNode.removeChild(gameState.renderer.domElement);
    }
    gameState.renderer.dispose();
  }
  gameState.audioContext?.close?.().catch?.(() => {});
  if (mountRef?.current?.contains?.(gameState._canvasEl)) {
    mountRef.current.removeChild(gameState._canvasEl);
  }
}
