import test from "node:test";
import assert from "node:assert/strict";

import { ENEMY_TYPES } from "../src/game/core/constants.js";
import {
  advanceWave,
  chooseEnemyAttack,
  collidesWall,
  createEnemyState,
  createPlayerState,
  createSimulationState,
  ENEMY_ATTACK,
  hasLineOfSight,
  resetPlayerState,
  stepEnemyMovement,
  stepPlayerMovement,
  sweptHit,
} from "../src/game/simulation/index.js";

test("simulation state is serializable and contains no renderer objects", () => {
  const simulation = createSimulationState();
  simulation.enemies.push(createEnemyState("rifleman", 4, -2, () => 0.5));

  const snapshot = JSON.parse(JSON.stringify(simulation));
  assert.deepEqual(snapshot.player.position, { x: 0, z: 0 });
  assert.equal(snapshot.enemies[0].type, "rifleman");
  assert.equal("mesh" in snapshot.player, false);
  assert.equal("mesh" in snapshot.enemies[0], false);
});

test("player movement advances numeric state without Three.js", () => {
  const player = createPlayerState();
  stepPlayerMovement(player, { x: 1, z: 0 }, 1, []);

  assert.ok(player.position.x > 0);
  assert.equal(player.position.z, 0);
});

test("collision and line of sight use plain map data", () => {
  const walls = [{ x: 2, z: 0, hw: 0.5, hd: 0.5 }];

  assert.equal(collidesWall(walls, 2, 0), true);
  assert.equal(collidesWall(walls, 0, 0), false);
  assert.equal(hasLineOfSight(walls, { x: 0, z: 0 }, { x: 4, z: 0 }), false);
  assert.equal(
    sweptHit({ x: 0, z: 0 }, { x: 4, z: 0 }, { x: 2, z: 0 }, 0.25),
    true,
  );
});

test("enemy movement runs headlessly", () => {
  const enemy = createEnemyState("rifleman", 8, 0, () => 0.5);
  enemy.cfg = ENEMY_TYPES.rifleman;
  const before = enemy.position.x;

  stepEnemyMovement(enemy, { x: 0, z: 0 }, 1, [], true, () => 0.5);

  assert.equal(enemy.state, "chase");
  assert.ok(enemy.position.x < before);
});

test("grenadier throws instead of consuming its cooldown on a bullet", () => {
  const grenadier = {
    alive: true,
    type: "grenadier",
    cfg: ENEMY_TYPES.grenadier,
    shootTimer: 0,
  };

  assert.equal(chooseEnemyAttack(grenadier, 8, true), ENEMY_ATTACK.GRENADE);
  assert.equal(chooseEnemyAttack(grenadier, 12, true), null);
  assert.equal(chooseEnemyAttack(grenadier, 8, false), null);
});

test("wave progression is independent from UI and renderer", () => {
  const simulation = createSimulationState();
  assert.deepEqual(advanceWave(simulation, 2), { complete: false, wave: 1 });
  assert.deepEqual(advanceWave(simulation, 2), { complete: true, wave: 2 });
  assert.equal(simulation.phase, "win");
});

test("player reset restores a clean simulation state", () => {
  const player = createPlayerState();
  player.hp = 0;
  player.position.x = 12;
  player.velocity.z = 3;
  player.alive = false;

  resetPlayerState(player);

  assert.equal(player.hp, player.maxHp);
  assert.deepEqual(player.position, { x: 0, z: 0 });
  assert.deepEqual(player.velocity, { x: 0, z: 0 });
  assert.equal(player.alive, true);
});
