export function advanceWave(simulation, waveCount) {
  simulation.wave += 1;
  if (simulation.wave >= waveCount) {
    simulation.phase = "win";
    return { complete: true, wave: simulation.wave };
  }
  return { complete: false, wave: simulation.wave };
}
