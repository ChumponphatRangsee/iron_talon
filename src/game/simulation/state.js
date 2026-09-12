import { ENEMY_TYPES, PLAYER_CFG } from "../core/constants.js";

export function createPlayerState() {
  return {
    position: { x: 0, z: 0 },
    velocity: { x: 0, z: 0 },
    knockback: { x: 0, z: 0 },
    facing: 0,
    hp: PLAYER_CFG.maxHp,
    maxHp: PLAYER_CFG.maxHp,
    armor: PLAYER_CFG.maxArmor,
    maxArmor: PLAYER_CFG.maxArmor,
    ammo: PLAYER_CFG.maxAmmo,
    maxAmmo: PLAYER_CFG.maxAmmo,
    grenades: PLAYER_CFG.maxGrenades,
    shootTimer: 0,
    reloadTimer: 0,
    iFrames: 0,
    stumbleTimer: 0,
    dodgeTimer: 0,
    dodgeDirX: 0,
    dodgeDirZ: 0,
    bobT: 0,
    airstrikeTimer: 0,
    droneTimer: 0,
    alive: true,
    reloading: false,
    dodging: false,
  };
}

export function resetPlayerState(player) {
  Object.assign(player, createPlayerState());
  return player;
}

export function createEnemyState(type, x, z, random = Math.random) {
  const cfg = ENEMY_TYPES[type] || ENEMY_TYPES.rifleman;
  const angle = random() * Math.PI * 2;
  return {
    type,
    cfg,
    position: { x, z },
    velocity: { x: 0, z: 0 },
    knockback: { x: 0, z: 0 },
    facing: 0,
    hp: cfg.hp,
    maxHp: cfg.hp,
    state: "patrol",
    patrolDir: { x: Math.sin(angle), z: Math.cos(angle) },
    patrolTimer: 60 + random() * 60,
    shootTimer: random() * cfg.shootInt,
    hitFlash: 0,
    deathTimer: -1,
    deathRotTarget: 0,
    alive: true,
    droneMarked: 0,
    strafeDir: 1,
    strafeTimer: 0,
  };
}

export function createSimulationState() {
  return {
    phase: "menu",
    wave: 0,
    player: createPlayerState(),
    enemies: [],
  };
}
