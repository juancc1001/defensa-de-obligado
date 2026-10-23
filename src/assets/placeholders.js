import { enemies } from '../data/enemies.js';
import { towers } from '../data/towers.js';
import { items } from '../data/items.js';
import { maps } from '../data/maps.js';
import { TILE } from '../config.js';

// Draws a colored shape for every sprite referenced in data that has no real image yet,
// so new content is playable before art exists.
export function makePlaceholders(scene) {
  const wanted = [
    ...Object.values(enemies).map((d) => [d.sprite, 'ship', 12]),
    ...Object.values(towers).map((d) => [d.sprite, 'square', 12]),
    ...Object.values(towers).map((d) => [d.weapon.projectile.sprite, 'circle', 6]),
    ...Object.values(items).map((d) => [d.sprite, 'diamond', 11]),
    ...Object.values(maps).map((m) => [m.level.objective.sprite, 'links', TILE]),
  ];

  for (const [key, shape, size] of wanted) {
    if (scene.textures.exists(key)) continue;
    const g = scene.make.graphics({}, false);
    g.fillStyle(colorFor(key));
    g.lineStyle(2, 0x000000);
    if (shape === 'ship') {
      g.fillTriangle(0, 4, size, size / 2, 0, size - 4);
      g.strokeTriangle(0, 4, size, size / 2, 0, size - 4);
    } else if (shape === 'circle') {
      g.fillCircle(size / 2, size / 2, size / 2);
    } else if (shape === 'links') {
      // Repeats vertically as a chain (the objective is a TileSprite).
      g.lineStyle(2, 0x777777);
      g.strokeEllipse(size / 2, size / 4, size / 3, size / 2);
      g.strokeEllipse(size / 2, (size * 3) / 4, size / 3, size / 2);
    } else if (shape === 'diamond') {
      const h = size / 2;
      g.fillPoints([{ x: h, y: 0 }, { x: size, y: h }, { x: h, y: size }, { x: 0, y: h }], true);
    } else {
      g.fillRect(0, 0, size, size);
      g.strokeRect(1, 1, size - 2, size - 2);
    }
    g.generateTexture(key, size, size);
    g.destroy();
  }
}

// Stable color per key.
export function colorFor(key) {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h & 0xffffff;
}
