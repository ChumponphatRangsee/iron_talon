import { disposeInputBindings } from "../input/disposeInput";

export function disposeRuntime(gameState, mountRef) {
  if (gameState.animId) cancelAnimationFrame(gameState.animId);
  disposeInputBindings(gameState);
  if (gameState.renderer) {
    if (gameState.renderer.domElement?.parentNode) {
      gameState.renderer.domElement.parentNode.removeChild(gameState.renderer.domElement);
    }
    gameState.renderer.dispose();
  }
  if (Array.isArray(gameState._timeouts)) {
    gameState._timeouts.forEach((id) => clearTimeout(id));
    gameState._timeouts.length = 0;
  }
  if (mountRef?.current?.contains?.(gameState._canvasEl)) {
    mountRef.current.removeChild(gameState._canvasEl);
  }
}
