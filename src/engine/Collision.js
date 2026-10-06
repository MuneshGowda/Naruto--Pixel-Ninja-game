/**
 * 2D Box Collision Engine for Fighting Game
 * Handles AABB (Axis-Aligned Bounding Box) intersection and Hitbox vs Hurtbox detection.
 */

export class Collision {
  /**
   * Check if two rectangular bounding boxes intersect (AABB)
   * @param {Object} a - { x, y, width, height }
   * @param {Object} b - { x, y, width, height }
   * @returns {boolean}
   */
  static isIntersecting(a, b) {
    if (!a || !b) return false;
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  /**
   * Check if attacker's active attack hitbox collides with defender's hurtbox
   * @param {Player} attacker 
   * @param {Player} defender 
   * @returns {Object|null} Collision info if hit, otherwise null
   */
  static checkHit(attacker, defender) {
    if (!attacker || !defender) return null;
    if (defender.isDead || defender.isInvincible) return null;

    // Attacker must have an active attack and hitbox
    const hitbox = attacker.getActiveHitbox();
    if (!hitbox) return null;

    // Can only hit once per attack execution unless specified
    if (attacker.hasHitTarget) return null;

    // Defender hurtbox
    const hurtbox = defender.getHurtbox();
    if (!hurtbox) return null;

    // Check AABB collision
    if (this.isIntersecting(hitbox, hurtbox)) {
      // Mark as landed so single punch doesn't trigger 10 times in 10 frames
      attacker.hasHitTarget = true;

      // Calculate center point of collision impact for FX
      const impactX = Math.max(hitbox.x, Math.min(hitbox.x + hitbox.width, (hitbox.x + hurtbox.x + hurtbox.width) / 2));
      const impactY = Math.max(hitbox.y, Math.min(hitbox.y + hitbox.height, (hitbox.y + hurtbox.y + hurtbox.height) / 2));

      const attackData = attacker.currentAttackData;

      return {
        hit: true,
        damage: attackData?.damage || 10,
        knockbackX: (attackData?.knockbackX || 6) * attacker.facing,
        knockbackY: attackData?.knockbackY || -4,
        hitstun: attackData?.hitstun || 16,
        screenShake: attackData?.screenShake || 8,
        impactX,
        impactY,
        attackType: attackData?.id || 'attack',
        attackerId: attacker.config.id
      };
    }

    return null;
  }
}
