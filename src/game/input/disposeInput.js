export function disposeInputBindings(gameState) {
  if (gameState._kd) window.removeEventListener("keydown", gameState._kd);
  if (gameState._ku) window.removeEventListener("keyup", gameState._ku);
  if (gameState._mu) window.removeEventListener("mouseup", gameState._mu);
  if (gameState._resize) window.removeEventListener("resize", gameState._resize);
  if (gameState.renderer?.domElement) {
    const cv = gameState.renderer.domElement;
    if (gameState._mm) cv.removeEventListener("mousemove", gameState._mm);
    if (gameState._md) cv.removeEventListener("mousedown", gameState._md);
    if (gameState._mctx) cv.removeEventListener("contextmenu", gameState._mctx);
  }
}
