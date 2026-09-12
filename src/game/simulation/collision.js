export function collidesWall(walls, x, z, radius = 0.38) {
  for (let i = 0; i < walls.length; i += 1) {
    const wall = walls[i];
    if (
      Math.abs(x - wall.x) < wall.hw + radius &&
      Math.abs(z - wall.z) < wall.hd + radius
    ) {
      return true;
    }
  }
  return false;
}

export function sweptHit(start, end, target, radius) {
  const dx = end.x - start.x;
  const dy = (end.y || 0) - (start.y || 0);
  const dz = end.z - start.z;
  const fx = start.x - target.x;
  const fy = (start.y || 0) - (target.y || 0);
  const fz = start.z - target.z;
  const a = dx * dx + dy * dy + dz * dz;

  if (a < 1e-5) return fx * fx + fy * fy + fz * fz < radius * radius;

  const b = 2 * (fx * dx + fy * dy + fz * dz);
  const c = fx * fx + fy * fy + fz * fz - radius * radius;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return false;

  const root = Math.sqrt(discriminant);
  const t1 = (-b - root) / (2 * a);
  const t2 = (-b + root) / (2 * a);
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

export function hasLineOfSight(walls, source, target) {
  const dx = target.x - source.x;
  const dz = target.z - source.z;
  const distance = Math.hypot(dx, dz);
  if (distance < 0.1) return true;

  const dirX = dx / distance;
  const dirZ = dz / distance;
  for (let offset = 0.5; offset < distance - 0.5; offset += distance / 6) {
    const x = source.x + dirX * offset;
    const z = source.z + dirZ * offset;
    if (collidesWall(walls, x, z, 0.1)) return false;
  }
  return true;
}
