import Phaser from 'phaser';

// Follows a map path; `progress` is the distance travelled in pixels.
export default {
  init(enemy, { path }) {
    enemy.path = path;
    enemy.progress = 0;
    const start = path.getStartPoint();
    enemy.setPosition(start.x, start.y);
  },

  update(enemy, dt) {
    enemy.progress += enemy.speed * dt;
    const length = enemy.path.getLength();
    if (enemy.progress >= length) {
      enemy.progress = length;
      enemy.reachGoal();
      return;
    }
    const p = enemy.path.getPoint(enemy.progress / length);
    enemy.rotation = Phaser.Math.Angle.Between(enemy.x, enemy.y, p.x, p.y);
    enemy.setPosition(p.x, p.y);
  },
};
