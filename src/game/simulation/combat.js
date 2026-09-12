export const ENEMY_ATTACK = Object.freeze({
  BULLET: "bullet",
  SHOTGUN: "shotgun",
  GRENADE: "grenade",
});

export function chooseEnemyAttack(enemy, distance, canSeeTarget) {
  if (!enemy.alive || enemy.shootTimer > 0 || !canSeeTarget) return null;

  if (enemy.type === "grenadier") {
    return distance < 11 ? ENEMY_ATTACK.GRENADE : null;
  }

  if (distance >= enemy.cfg.range) return null;
  return enemy.type === "shotgunner"
    ? ENEMY_ATTACK.SHOTGUN
    : ENEMY_ATTACK.BULLET;
}
