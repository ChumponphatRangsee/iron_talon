export const PLAYER_CFG = {
  walkSpeed: 0.22, // units/frame at 60fps
  acceleration: 0.28, // velocity lerp factor
  deceleration: 0.35, // faster stop than start
  dodgeSpeed: 0.52,
  dodgeDur: 18, // frames
  dodgeIFrames: 14,
  maxHp: 100,
  maxArmor: 50,
  maxAmmo: 30,
  maxGrenades: 3,
  shootInterval: 10,
  reloadTime: 75,
};

export const ENEMY_TYPES = {
  rifleman: {
    col: 0x6b2b15,
    hCol: 0x3a1a0a,
    hp: 60,
    spd: 0.06,
    shootInt: 65,
    range: 11,
    dmg: 10,
    score: 100,
    label: "RIFLEMAN",
    prefDist: 4.0,
  },
  shotgunner: {
    col: 0x8b1a1a,
    hCol: 0x4a0a0a,
    hp: 40,
    spd: 0.1,
    shootInt: 95,
    range: 4.5,
    dmg: 20,
    score: 150,
    label: "SHOTGUNNER",
    prefDist: 1.5,
  },
  heavy: {
    col: 0x2a3a6b,
    hCol: 0x1a2a4a,
    hp: 180,
    spd: 0.032,
    shootInt: 42,
    range: 9,
    dmg: 16,
    score: 250,
    label: "HEAVY",
    prefDist: 4.5,
  },
  sniper: {
    col: 0x3a5a2a,
    hCol: 0x1a3a0a,
    hp: 45,
    spd: 0.035,
    shootInt: 130,
    range: 18,
    dmg: 32,
    score: 200,
    label: "SNIPER",
    prefDist: 10,
  },
  grenadier: {
    col: 0x7a5a0a,
    hCol: 0x4a3a0a,
    hp: 55,
    spd: 0.05,
    shootInt: 160,
    range: 10,
    dmg: 28,
    score: 200,
    label: "GRENADIER",
    prefDist: 6,
  },
};

export const WAVES = [
  { cfg: [["rifleman", 4]], label: "BREACH", obj: "Eliminate all enemies" },
  { cfg: [["rifleman", 3], ["shotgunner", 2]], label: "ASSAULT", obj: "Clear the compound" },
  { cfg: [["rifleman", 3], ["shotgunner", 2], ["heavy", 1]], label: "EXTRACTION", obj: "Neutralize all hostiles" },
  { cfg: [["rifleman", 3], ["sniper", 2], ["heavy", 1], ["grenadier", 1]], label: "INFILTRATE", obj: "Destroy enemy command" },
  { cfg: [["rifleman", 3], ["shotgunner", 2], ["sniper", 2], ["heavy", 1], ["grenadier", 2]], label: "IRON TALON", obj: "Full assault - survive!" },
];
