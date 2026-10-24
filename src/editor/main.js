import { TILE, ZOOM } from '../config.js';
import { towers } from '../data/towers.js';
import { enemies } from '../data/enemies.js';
import { items } from '../data/items.js';
import { terrain } from '../data/terrain.js';
import { sprites } from '../data/sprites.js';
import { colorFor } from '../assets/placeholders.js';
import { requireLogin } from '../services/auth.js';
import * as api from '../services/api.js';

await requireLogin();

const SIZE = TILE * ZOOM;

// Saved as point objects in the `entities` layer: name = data id, type = kind.
// Besides these, `spawn` points (name = entry number) and one `objective` point (the chains).
const kinds = {
  tower: { label: 'Torres', defs: towers, shape: 'square' },
  ship: { label: 'Barcos propios', defs: items, shape: 'diamond' },
};

const newLevel = (name) => ({ name, gold: 150, objective: { name: 'Cadenas', sprite: 'chains', hp: 100 }, waves: [] });

// Terrain types (and their zones) come from src/data/terrain.json.
const tileset = {
  firstgid: 1,
  name: 'terrain',
  image: '../tiles/terrain.png',
  imagewidth: 64,
  imageheight: 32,
  tilewidth: 16,
  tileheight: 16,
  tilecount: 8,
  columns: 4,
  margin: 0,
  spacing: 0,
};

const gid = (t) => t.tile + tileset.firstgid;

const $ = (id) => document.getElementById(id);
const canvas = $('map');
const ctx = canvas.getContext('2d');
let map;

const tilesImage = loadImage('assets/tiles/terrain.png');
// Uploaded sprites are drawn instead of the placeholder shapes.
const spriteImages = Object.fromEntries(Object.entries(sprites).map(([key, file]) => [key, loadImage(file)]));

Promise.all([tilesImage, ...Object.values(spriteImages)].map((img) => img.decode().catch(() => {}))).then(() => {
  buildPalette();
  listMaps();
  if (location.hash) loadMap(location.hash.slice(1));
  else newMap();
});

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

// --- Maps ---

async function listMaps() {
  const names = await api.listMaps();
  $('maps').innerHTML = '';
  for (const name of names) {
    const li = document.createElement('li');
    li.textContent = name;
    li.onclick = () => loadMap(name);
    $('maps').append(li);
  }
}

async function loadMap(name) {
  map = await api.loadMap(name);
  map.level ??= newLevel(name);
  location.hash = name;
  $('name').value = name;
  showSize();
  draw();
}

function newMap() {
  const w = Number($('width').value);
  const h = Number($('height').value);
  map = {
    width: w,
    height: h,
    tilewidth: TILE,
    tileheight: TILE,
    infinite: false,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    type: 'map',
    version: '1.10',
    nextlayerid: 2,
    nextobjectid: 1,
    layers: [
      { id: 1, name: 'ground', type: 'tilelayer', width: w, height: h, x: 0, y: 0, opacity: 1, visible: true, data: Array(w * h).fill(gid(terrain.floor)) },
    ],
    tilesets: [tileset],
    level: newLevel($('name').value),
  };
  draw();
}

async function save() {
  const name = $('name').value;
  try {
    await api.saveMap(name, map);
  } catch (e) {
    return alert(e.message);
  }
  location.hash = name;
  listMaps();
}

// Keeps what fits; new ground cells are floor.
function resize() {
  const w = Number($('width').value);
  const h = Number($('height').value);
  for (const layer of map.layers) {
    if (layer.type !== 'tilelayer') continue;
    const data = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (x < map.width && y < map.height) data.push(layer.data[y * map.width + x]);
        else data.push(layer.name === 'ground' ? gid(terrain.floor) : 0);
      }
    }
    layer.data = data;
    layer.width = w;
    layer.height = h;
  }
  const layer = entities();
  layer.objects = layer.objects.filter((o) => o.x < w * TILE && o.y < h * TILE);
  map.width = w;
  map.height = h;
  draw();
}

function showSize() {
  $('width').value = map.width;
  $('height').value = map.height;
}

function entities() {
  let layer = map.layers.find((l) => l.name === 'entities');
  if (!layer) {
    layer = { id: map.nextlayerid++, name: 'entities', type: 'objectgroup', draworder: 'topdown', x: 0, y: 0, opacity: 1, visible: true, objects: [] };
    map.layers.push(layer);
  }
  return layer;
}

$('new').onclick = newMap;
$('resize').onclick = resize;
$('save').onclick = save;

// --- Drawing ---

function draw() {
  canvas.width = map.width * SIZE;
  canvas.height = map.height * SIZE;
  ctx.imageSmoothingEnabled = false;
  for (const layer of map.layers) {
    if (layer.type !== 'tilelayer') continue;
    layer.data.forEach((gid, i) => drawTile(ctx, gid, (i % map.width) * SIZE, Math.floor(i / map.width) * SIZE));
  }
  for (const obj of entities().objects) drawEntity(ctx, obj.type, obj.name, obj.x * ZOOM, obj.y * ZOOM);
  // Entries may have changed, and the wave groups pick from them.
  renderLevel();
}

function drawTile(c, gid, x, y) {
  if (!gid) return;
  const id = gid - tileset.firstgid;
  const img = spriteImages[Object.values(terrain).find((t) => t.tile === id)?.sprite];
  if (img?.naturalWidth) return c.drawImage(img, x, y, SIZE, SIZE);
  c.drawImage(tilesImage, (id % tileset.columns) * TILE, Math.floor(id / tileset.columns) * TILE, TILE, TILE, x, y, SIZE, SIZE);
}

// Uploaded sprite if there is one, else the same shapes as the game's placeholders (src/assets/placeholders.js).
function drawEntity(c, kind, id, cx, cy) {
  if (kind === 'spawn') {
    drawShape(c, 'ship', '#cc2222', cx, cy);
    c.fillStyle = '#fff';
    c.font = 'bold 14px monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(id, cx - 4, cy);
    return;
  }
  const sprite = kind === 'objective' ? map?.level.objective.sprite ?? 'chains' : kinds[kind].defs[id].sprite;
  const img = spriteImages[sprite];
  if (img?.naturalWidth) {
    c.drawImage(img, cx - (img.width * ZOOM) / 2, cy - (img.height * ZOOM) / 2, img.width * ZOOM, img.height * ZOOM);
    return;
  }
  if (kind === 'objective') {
    // Chain links, like the game's placeholder.
    c.strokeStyle = '#777';
    c.lineWidth = 2 * ZOOM;
    for (const dy of [-TILE / 4, TILE / 4]) {
      c.beginPath();
      c.ellipse(cx, cy + dy * ZOOM, (TILE / 6) * ZOOM, (TILE / 4) * ZOOM, 0, 0, Math.PI * 2);
      c.stroke();
    }
    return;
  }
  drawShape(c, kinds[kind].shape, '#' + colorFor(sprite).toString(16).padStart(6, '0'), cx, cy);
}

function drawShape(c, shape, color, cx, cy) {
  const s = 12 * ZOOM;
  const x = cx - s / 2;
  const y = cy - s / 2;
  c.beginPath();
  if (shape === 'ship') {
    c.moveTo(x, y + 4 * ZOOM);
    c.lineTo(x + s, y + s / 2);
    c.lineTo(x, y + s - 4 * ZOOM);
  } else if (shape === 'diamond') {
    c.moveTo(x + s / 2, y);
    c.lineTo(x + s, y + s / 2);
    c.lineTo(x + s / 2, y + s);
    c.lineTo(x, y + s / 2);
  } else {
    c.rect(x, y, s, s);
  }
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.lineWidth = 2;
  c.strokeStyle = '#000';
  c.stroke();
}

// --- Palette: pick an element, then click the map to place it ---

let selected = null;

function buildPalette() {
  addSection(
    'Terreno',
    Object.values(terrain).map((t) => ({ kind: 'tile', id: gid(t), label: t.name, paint: (c) => drawTile(c, gid(t), 0, 0) })),
  );
  for (const [kind, k] of Object.entries(kinds)) {
    addSection(
      k.label,
      Object.entries(k.defs).map(([id, def]) => ({ kind, id, label: def.name, paint: (c) => drawEntity(c, kind, id, SIZE / 2, SIZE / 2) })),
    );
  }
  addSection('Nivel', [
    { kind: 'spawn', id: '', label: 'Entrada de enemigos', paint: (c) => drawEntity(c, 'spawn', '', SIZE / 2, SIZE / 2) },
    { kind: 'objective', id: 'chains', label: 'Cadenas', paint: (c) => drawEntity(c, 'objective', 'chains', SIZE / 2, SIZE / 2) },
  ]);
}

function addSection(title, entries) {
  const h = document.createElement('h3');
  h.textContent = title;
  const list = document.createElement('div');
  list.className = 'palette';
  for (const { kind, id, label, paint } of entries) {
    const item = document.createElement('div');
    item.onclick = () => {
      document.querySelector('.palette .selected')?.classList.remove('selected');
      item.classList.add('selected');
      selected = { kind, id };
    };
    const preview = document.createElement('canvas');
    preview.width = preview.height = SIZE;
    const c = preview.getContext('2d');
    c.imageSmoothingEnabled = false;
    paint(c);
    item.append(preview, document.createElement('br'), label);
    list.append(item);
  }
  $('palette').append(h, list);
}

canvas.onclick = (e) => {
  if (!selected) return;
  const { kind } = selected;
  let id = selected.id;
  const { tx, ty } = cellAt(e);
  // New entries get the next number; there is only one set of chains.
  if (kind === 'spawn') id = String(Math.max(0, ...spawns().map(Number)) + 1);
  if (kind === 'objective') entities().objects = entities().objects.filter((o) => o.type !== 'objective');

  if (kind === 'tile') {
    // Clear upper layers too, so the placed tile is the one that counts.
    for (const layer of map.layers) {
      if (layer.type === 'tilelayer') layer.data[ty * map.width + tx] = layer.name === 'ground' ? id : 0;
    }
  } else {
    removeEntityAt(tx, ty);
    entities().objects.push({
      id: map.nextobjectid++,
      name: id,
      type: kind,
      x: tx * TILE + TILE / 2,
      y: ty * TILE + TILE / 2,
      width: 0,
      height: 0,
      rotation: 0,
      visible: true,
      point: true,
    });
  }
  draw();
};

canvas.oncontextmenu = (e) => {
  e.preventDefault();
  const { tx, ty } = cellAt(e);
  removeEntityAt(tx, ty);
  draw();
};

function cellAt(e) {
  return { tx: Math.floor(e.offsetX / SIZE), ty: Math.floor(e.offsetY / SIZE) };
}

function spawns() {
  return entities()
    .objects.filter((o) => o.type === 'spawn')
    .map((o) => o.name);
}

function removeEntityAt(tx, ty) {
  const layer = entities();
  layer.objects = layer.objects.filter((o) => Math.floor(o.x / TILE) !== tx || Math.floor(o.y / TILE) !== ty);
}

// --- Level settings and waves ---

$('level-name').onchange = () => (map.level.name = $('level-name').value);
$('gold').onchange = () => (map.level.gold = Number($('gold').value));
$('chains-hp').onchange = () => (map.level.objective.hp = Number($('chains-hp').value));

function renderLevel() {
  $('level-name').value = map.level.name;
  $('gold').value = map.level.gold;
  $('chains-hp').value = map.level.objective.hp;

  // Entries placed on the map, plus the hand-drawn routes of Tiled maps.
  const paths = map.layers.find((l) => l.name === 'paths')?.objects.map((o) => o.name) ?? [];
  const entries = [...spawns(), ...paths];
  const enemyOptions = Object.entries(enemies).map(([id, def]) => [id, def.name]);

  const waves = map.level.waves;
  $('waves').innerHTML = '';
  waves.forEach((wave, i) => {
    const box = document.createElement('div');
    box.className = 'wave';
    box.append(
      `Oleada ${i + 1}: espera `,
      numberInput(wave, 'wait'),
      ' s ',
      button('Quitar oleada', () => waves.splice(i, 1)),
    );
    wave.spawns.forEach((group, j) => {
      const row = document.createElement('div');
      row.className = 'group';
      row.append(
        numberInput(group, 'count'),
        ' × ',
        selectInput(group, 'enemy', enemyOptions),
        ' por la entrada ',
        selectInput(group, 'path', entries.map((e) => [e, e])),
        ', uno cada ',
        numberInput(group, 'interval'),
        ' s, empieza a los ',
        numberInput(group, 'delay'),
        ' s ',
        button('Quitar', () => wave.spawns.splice(j, 1)),
      );
      box.append(row);
    });
    box.append(
      button('Agregar grupo', () => wave.spawns.push({ enemy: enemyOptions[0][0], count: 5, interval: 1, path: entries[0], delay: 0 })),
    );
    $('waves').append(box);
  });
  $('waves').append(button('Agregar oleada', () => waves.push({ wait: 5, spawns: [] })));
}

function numberInput(obj, key) {
  const input = document.createElement('input');
  input.type = 'number';
  input.value = obj[key] ?? 0;
  input.onchange = () => (obj[key] = Number(input.value));
  return input;
}

function selectInput(obj, key, options) {
  const s = document.createElement('select');
  for (const [value, label] of options) s.add(new Option(label, value));
  s.value = obj[key];
  s.onchange = () => (obj[key] = s.value);
  return s;
}

function button(label, onClick) {
  const b = document.createElement('button');
  b.textContent = label;
  b.onclick = () => {
    onClick();
    renderLevel();
  };
  return b;
}
