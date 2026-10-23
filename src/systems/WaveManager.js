import Enemy from '../entities/Enemy.js';

export default class WaveManager {
  constructor(scene, waves, paths) {
    this.scene = scene;
    this.waves = waves;
    this.paths = paths;
    this.index = -1;
    this.queue = [];
    this.timer = 0;
    this.countdown = waves[0].wait ?? 0;
  }

  // All waves started and fully spawned.
  get done() {
    return this.index >= this.waves.length - 1 && this.queue.length === 0;
  }

  update(dt) {
    if (this.queue.length) {
      this.timer += dt;
      while (this.queue.length && this.queue[0].at <= this.timer) {
        const s = this.queue.shift();
        new Enemy(this.scene, s.enemy, { path: this.paths[s.path] });
      }
      return;
    }
    if (this.done) return;

    this.countdown -= dt;
    if (this.countdown <= 0) this.startWave(this.index + 1);
  }

  startWave(i) {
    this.index = i;
    this.timer = 0;
    this.queue = this.waves[i].spawns
      .flatMap((s) =>
        Array.from({ length: s.count }, (_, k) => ({
          at: (s.delay ?? 0) + k * s.interval,
          enemy: s.enemy,
          path: s.path,
        })),
      )
      .sort((a, b) => a.at - b.at);
    this.countdown = this.waves[i + 1]?.wait ?? 0;
    this.scene.registry.set('wave', i + 1);
  }
}
