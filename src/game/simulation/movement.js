import { PLAYER_CFG } from "../core/constants.js";
import { lerp } from "../core/math.js";
import { collidesWall } from "./collision.js";

const WORLD_LIMIT = 22;

function moveWithCollision(entity, dx, dz, walls, radius = 0.38) {
  let blockedX = false;
  let blockedZ = false;
  const nextX = entity.position.x + dx;
  if (!collidesWall(walls, nextX, entity.position.z, radius) && Math.abs(nextX) < WORLD_LIMIT) {
    entity.position.x = nextX;
  } else if (entity.velocity) {
    entity.velocity.x *= -0.2;
    blockedX = true;
  }

  const nextZ = entity.position.z + dz;
  if (!collidesWall(walls, entity.position.x, nextZ, radius) && Math.abs(nextZ) < WORLD_LIMIT) {
    entity.position.z = nextZ;
  } else if (entity.velocity) {
    entity.velocity.z *= -0.2;
    blockedZ = true;
  }
  return { blockedX, blockedZ };
}

export function stepPlayerMovement(player, input, dt, walls) {
  const events = { dodgeEnded: false };

  if (player.iFrames > 0) player.iFrames -= dt;
  if (player.airstrikeTimer > 0) player.airstrikeTimer -= dt;
  if (player.droneTimer > 0) player.droneTimer -= dt;
  if (player.stumbleTimer > 0) player.stumbleTimer -= dt;

  if (player.dodging) {
    player.dodgeTimer -= dt;
    const progress = 1 - player.dodgeTimer / PLAYER_CFG.dodgeDur;
    const speed = PLAYER_CFG.dodgeSpeed * (1 - progress * 0.6);
    moveWithCollision(
      player,
      player.dodgeDirX * speed * dt,
      player.dodgeDirZ * speed * dt,
      walls,
    );
    if (player.dodgeTimer <= 0) {
      player.dodging = false;
      events.dodgeEnded = true;
    }
    return events;
  }

  let inputX = input.x;
  let inputZ = input.z;
  const inputLength = Math.hypot(inputX, inputZ);
  if (inputLength > 0) {
    inputX /= inputLength;
    inputZ /= inputLength;
  }

  const rate = inputLength > 0 ? PLAYER_CFG.acceleration : PLAYER_CFG.deceleration;
  player.velocity.x = lerp(player.velocity.x, inputX * PLAYER_CFG.walkSpeed, rate * dt);
  player.velocity.z = lerp(player.velocity.z, inputZ * PLAYER_CFG.walkSpeed, rate * dt);

  if (Math.hypot(player.knockback.x, player.knockback.z) > 0.001) {
    player.velocity.x += player.knockback.x * dt;
    player.velocity.z += player.knockback.z * dt;
    player.knockback.x *= 0.68;
    player.knockback.z *= 0.68;
  }

  moveWithCollision(player, player.velocity.x * dt, player.velocity.z * dt, walls);

  if (inputLength > 0) {
    const targetFacing = Math.atan2(inputX, inputZ);
    let delta = targetFacing - player.facing;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    player.facing += delta * 0.22 * dt;
  }

  if (Math.abs(player.velocity.x) + Math.abs(player.velocity.z) > 0.01) {
    player.bobT += 0.22 * dt;
  }
  return events;
}

export function stepEnemyMovement(enemy, target, dt, walls, canSeeTarget, random = Math.random) {
  const dx = target.x - enemy.position.x;
  const dz = target.z - enemy.position.z;
  const distance = Math.hypot(dx, dz);
  const dirX = distance > 0 ? dx / distance : 0;
  const dirZ = distance > 0 ? dz / distance : 1;

  if (distance < 15 && canSeeTarget) enemy.state = "chase";
  else if (distance > 18 || !canSeeTarget) enemy.state = "patrol";

  enemy.velocity.x *= 0.72;
  enemy.velocity.z *= 0.72;
  if (Math.hypot(enemy.knockback.x, enemy.knockback.z) > 0.001) {
    enemy.velocity.x += enemy.knockback.x;
    enemy.velocity.z += enemy.knockback.z;
    enemy.knockback.x *= 0.6;
    enemy.knockback.z *= 0.6;
  }

  if (enemy.state === "patrol") {
    enemy.patrolTimer -= dt;
    if (enemy.patrolTimer <= 0) {
      const angle = random() * Math.PI * 2;
      enemy.patrolDir.x = Math.sin(angle);
      enemy.patrolDir.z = Math.cos(angle);
      enemy.patrolTimer = 55 + random() * 60;
    }
    const collision = moveWithCollision(
      enemy,
      enemy.patrolDir.x * enemy.cfg.spd * 0.65 * dt,
      enemy.patrolDir.z * enemy.cfg.spd * 0.65 * dt,
      walls,
    );
    if (collision.blockedX || collision.blockedZ) {
      enemy.patrolDir.x *= -1;
      enemy.patrolDir.z *= -1;
    }
    enemy.facing = Math.atan2(enemy.patrolDir.x, enemy.patrolDir.z);
    return distance;
  }

  enemy.strafeTimer -= dt;
  if (enemy.strafeTimer <= 0) {
    enemy.strafeDir *= -1;
    enemy.strafeTimer = 30 + random() * 40;
  }

  let moveX = 0;
  let moveZ = 0;
  if (distance > enemy.cfg.prefDist + 1.5) {
    moveX += dirX * enemy.cfg.spd;
    moveZ += dirZ * enemy.cfg.spd;
  } else if (distance < enemy.cfg.prefDist - 0.5) {
    moveX -= dirX * enemy.cfg.spd * 0.6;
    moveZ -= dirZ * enemy.cfg.spd * 0.6;
  }
  moveX += -dirZ * enemy.strafeDir * enemy.cfg.spd * 0.5;
  moveZ += dirX * enemy.strafeDir * enemy.cfg.spd * 0.5;

  moveWithCollision(
    enemy,
    (moveX + enemy.velocity.x) * dt,
    (moveZ + enemy.velocity.z) * dt,
    walls,
  );
  enemy.facing = Math.atan2(dirX, dirZ);
  enemy.shootTimer -= dt;
  return distance;
}
