import Phaser from 'phaser';

// Area damage around ctx.x/ctx.y. Ignores the direct target.
export default {
  params: ['amount', 'radius'],

  apply(scene, target, { amount, radius }, ctx) {
    const flash = scene.add.circle(ctx.x, ctx.y, radius, 0xffaa00, 0.5);
    scene.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

    for (const enemy of [...scene.enemies.getChildren()]) {
      if (Phaser.Math.Distance.Between(ctx.x, ctx.y, enemy.x, enemy.y) <= radius) {
        enemy.takeDamage(amount);
      }
    }
  },
};
