export function createInitialUiState() {
  return {
    hp: 100,
    armor: 50,
    ammo: 30,
    grenades: 3,
    score: 0,
    enemies: 0,
    wave: 0,
    state: "menu",
    flash: false,
    reloading: false,
    dodging: false,
    airstrikeReady: true,
    droneReady: true,
    combo: 0,
    kills: 0,
    waveLabel: "BREACH",
    obj: "Eliminate all enemies",
  };
}
