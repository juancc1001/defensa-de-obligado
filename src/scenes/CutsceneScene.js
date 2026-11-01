import Phaser from 'phaser';
import ojoDerechoUrl from '../assets/ojo_derecho.png';
import dialogs from '../data/cutscene.json';
import { levels } from '../data/levels.js';

// PSX Doom fire palette (fabiensanglard/DoomFirePSX), index 0 is drawn transparent.
const PALETTE = [
  [7, 7, 7], [31, 7, 7], [47, 15, 7], [71, 15, 7], [87, 23, 7], [103, 31, 7], [119, 31, 7], [143, 39, 7],
  [159, 47, 7], [175, 63, 7], [191, 71, 7], [199, 71, 7], [223, 79, 7], [223, 87, 7], [223, 87, 7],
  [215, 95, 7], [215, 95, 7], [215, 103, 15], [207, 111, 15], [207, 119, 15], [207, 127, 15],
  [207, 135, 23], [199, 135, 23], [199, 143, 23], [199, 151, 31], [191, 159, 31], [191, 159, 31],
  [191, 167, 39], [191, 167, 39], [191, 175, 47], [183, 175, 47], [183, 183, 47], [183, 183, 55],
  [207, 207, 111], [223, 223, 159], [239, 239, 199], [255, 255, 255],
];
const FIRE_SCALE = 4;
const FIRE_STEP = 1000 / 27;
// Chance per step that a silhouette cell touching the stain gets filled.
const GROW_CHANCE = 0.4;
const BLINK_EVERY = 4000;
const BLINK_DURATION = 400;
// Milliseconds between letters while a dialog is being written.
const TYPE_DELAY = 40;

export default class CutsceneScene extends Phaser.Scene {
  constructor() {
    super('Cutscene');
  }

  preload() {
    this.load.image('ojoDerecho', ojoDerechoUrl);
  }

  create() {
    const { width, height } = this.scale;
    const bgHeight = Math.round(height * 0.75);

    this.container = this.add.container(0, 0);
    const background = this.add.rectangle(0, 0, width, bgHeight, 0x000000).setOrigin(0);
    const textSection = this.add.rectangle(0, bgHeight, width, height - bgHeight, 0x111111).setOrigin(0);

    this.fireW = Math.ceil(width / FIRE_SCALE);
    this.fireH = Math.ceil(bgHeight / FIRE_SCALE);
    this.fire = new Uint8Array(this.fireW * this.fireH);
    this.fire.fill(PALETTE.length - 1, (this.fireH - 1) * this.fireW);

    if (this.textures.exists('doomFire')) this.textures.remove('doomFire');
    this.fireTexture = this.textures.createCanvas('doomFire', this.fireW, this.fireH);
    this.fireCtx = this.fireTexture.getContext();
    this.fireImage = this.fireCtx.createImageData(this.fireW, this.fireH);
    const fire = this.add.image(0, 0, 'doomFire').setOrigin(0).setScale(FIRE_SCALE);

    this.container.add([background, fire, textSection]);
    this.elapsed = 0;
    this.createSilhouette();

    // Dialogs from src/data/cutscene.json, one at a time in the text section. Click or space shows the next one.
    this.dialog = this.add.text(24, bgHeight + 16, '', {
      fontFamily: 'monospace',
      fontSize: '22px',
      wordWrap: { width: width - 48 },
    });
    this.container.add(this.dialog);
    this.dialogIndex = 0;
    this.dialogStarted = false;
    this.input.on('pointerdown', () => this.nextDialog());
    this.input.keyboard.on('keydown-SPACE', () => this.nextDialog());
  }

  // Writes the dialog letter by letter. It's wrapped first so words don't jump to the next line halfway through.
  showDialog() {
    const { text, color = '#ffffff' } = dialogs[this.dialogIndex];
    this.fullText = this.dialog.getWrappedText(text).join('\n');
    this.typed = 0;
    this.dialog.setText('').setColor(color);
    this.typing = this.time.addEvent({
      delay: TYPE_DELAY,
      repeat: this.fullText.length - 1,
      callback: () => this.dialog.setText(this.fullText.slice(0, ++this.typed)),
    });
  }

  // While the dialog is still being written, click or space completes it; after that it moves to the next one.
  nextDialog() {
    if (!this.dialogStarted) return;
    if (this.typed < this.fullText.length) {
      this.typing.remove();
      this.typed = this.fullText.length;
      this.dialog.setText(this.fullText);
      return;
    }
    if (this.dialogIndex === dialogs.length - 1) {
      this.scene.start('Game', { mapId: levels[0].map });
      return;
    }
    this.dialogIndex++;
    this.showDialog();
  }

  // Bust from the chest up, standing on the bottom of the fire. Kept below the flame tops so it shows against them.
  createSilhouette() {
    const { fireW, fireH } = this;
    const s = fireH * 0.65;
    const top = fireH - s;
    const cx = fireW / 2;
    const inEllipse = (x, y, ex, ey, rx, ry) => ((x - ex) / rx) ** 2 + ((y - ey) / ry) ** 2 <= 1;

    this.mask = new Uint8Array(fireW * fireH);
    this.grown = new Uint8Array(fireW * fireH);
    for (let y = 0; y < fireH; y++) {
      for (let x = 0; x < fireW; x++) {
        // Round skull on top, straight jaw narrowing to the chin (V) below the middle of the head.
        const hy = top + 0.16 * s;
        const t = (y - hy) / (0.24 * s);
        const head =
          t < 0 ? inEllipse(x, y, cx, hy, 0.204 * s, 0.24 * s) : t <= 1 && Math.abs(x - cx) < 0.204 * s * (1 - 0.6 * t);
        // Pointed ears: a round base plus a triangle from its center to a tip leaning up and out.
        const earBase =
          inEllipse(x, y, cx - 0.204 * s, top + 0.184 * s, 0.048 * s, 0.084 * s) ||
          inEllipse(x, y, cx + 0.204 * s, top + 0.184 * s, 0.048 * s, 0.084 * s);
        const e = (y - top - 0.02 * s) / (0.164 * s);
        const earX = 0.204 * s + (1 - e) * 0.05 * s;
        const earTip = e >= 0 && e <= 1 && Math.abs(Math.abs(x - cx) - earX) < 0.048 * s * e;
        const ears = earBase || earTip;
        const neck = Math.abs(x - cx) < 0.12 * s && y > top + 0.35 * s;
        // Rounded shoulders (a quarter ellipse) from the base of the neck, then the arms open diagonally downwards.
        const dy = y - (top + 0.42 * s);
        const shoulder = 0.2 * s;
        const halfWidth =
          dy < shoulder
            ? 0.15 * s + 0.35 * s * Math.sqrt(1 - (1 - dy / shoulder) ** 2)
            : 0.5 * s + (dy - shoulder) * 0.5;
        const chest = dy >= 0 && Math.abs(x - cx) < halfWidth;
        if (head || ears || neck || chest) this.mask[y * fireW + x] = 1;
      }
    }

    const seedX = Math.round(cx);
    const seedY = Math.round(top + 0.8 * s);
    for (let y = seedY - 1; y <= seedY + 1; y++) {
      for (let x = seedX - 1; x <= seedX + 1; x++) this.grown[y * fireW + x] = 1;
    }
    this.remaining = this.mask.filter((m, i) => m && !this.grown[i]).length;

    // Eye on the right side of the face, drawn on the fire grid so its pixels match the silhouette.
    // Each cell takes the most common color of the PNG area it covers; the PNG's near-black becomes the silhouette's black.
    const img = this.textures.get('ojoDerecho').getSourceImage();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const src = ctx.getImageData(0, 0, img.width, img.height).data;

    const size = Math.round(0.16 * s);
    this.eyeSize = size;
    const cell = img.width / size;
    const ex = Math.round(cx + 0.09 * s - size / 2);
    const ey = Math.round(top + 0.16 * s - size / 2);
    this.eye = [];
    for (let gy = 0; gy < size; gy++) {
      for (let gx = 0; gx < size; gx++) {
        const counts = new Map();
        for (let y = Math.floor(gy * cell); y < Math.floor((gy + 1) * cell); y++) {
          for (let x = Math.floor(gx * cell); x < Math.floor((gx + 1) * cell); x++) {
            const p = (y * img.width + x) * 4;
            const key = src[p + 3] < 128 ? 'none' : `${src[p]},${src[p + 1]},${src[p + 2]}`;
            counts.set(key, (counts.get(key) || 0) + 1);
          }
        }
        const [key] = [...counts].sort((a, b) => b[1] - a[1])[0];
        if (key === 'none') continue;
        const rgb = key.split(',').map(Number);
        const color = Math.max(...rgb) < 50 ? [0, 0, 0] : rgb;
        // Left eye: the same cell mirrored across the center of the face.
        const mirrorX = Math.round(2 * cx - (ex + gx) - 1);
        this.eye.push([(ey + gy) * fireW + ex + gx, color, gy], [(ey + gy) * fireW + mirrorX, color, gy]);
      }
    }
  }

  growSilhouette() {
    const { mask, grown, fireW } = this;
    const next = grown.slice();
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i] || grown[i]) continue;
      const x = i % fireW;
      const touching = grown[i - fireW] || grown[i + fireW] || (x > 0 && grown[i - 1]) || (x < fireW - 1 && grown[i + 1]);
      if (touching && Math.random() < GROW_CHANCE) {
        next[i] = 1;
        this.remaining--;
      }
    }
    this.grown = next;
  }

  update(time, delta) {
    this.elapsed += delta;
    if (this.elapsed < FIRE_STEP) return;
    this.elapsed %= FIRE_STEP;

    const { fire, fireW, fireH } = this;
    for (let x = 0; x < fireW; x++) {
      for (let y = 1; y < fireH; y++) {
        const src = y * fireW + x;
        const rand = Math.round(Math.random() * 3) & 3;
        fire[src - fireW - rand + 1] = Math.max(0, fire[src] - (rand & 1));
      }
    }

    this.growSilhouette();
    if (this.remaining === 0 && !this.dialogStarted) {
      this.dialogStarted = true;
      this.showDialog();
    }

    const data = this.fireImage.data;
    for (let i = 0; i < fire.length; i++) {
      const [r, g, b] = this.grown[i] ? [0, 0, 0] : PALETTE[fire[i]];
      data[i * 4] = r;
      data[i * 4 + 1] = g;
      data[i * 4 + 2] = b;
      data[i * 4 + 3] = fire[i] || this.grown[i] ? 255 : 0;
    }
    // Blink: the lid comes down from the top row of the eye and goes back up, leaving the silhouette's black.
    const blink = time % BLINK_EVERY;
    const closed = blink < BLINK_DURATION ? 1 - Math.abs((2 * blink) / BLINK_DURATION - 1) : 0;
    const lidRows = Math.round(closed * this.eyeSize);
    for (const [i, [r, g, b], row] of this.eye) {
      if (!this.grown[i] || row < lidRows) continue;
      data[i * 4] = r;
      data[i * 4 + 1] = g;
      data[i * 4 + 2] = b;
      data[i * 4 + 3] = 255;
    }
    this.fireCtx.putImageData(this.fireImage, 0, 0);
    this.fireTexture.refresh();
  }
}
