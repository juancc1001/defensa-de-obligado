import { TILE, ZOOM } from '../config.js';
import { towers } from '../data/towers.js';
import { enemies } from '../data/enemies.js';
import { items } from '../data/items.js';
import { terrain, zones } from '../data/terrain.js';
import { sprites } from '../data/sprites.js';
import { effects } from '../effects/index.js';
import { movements } from '../movement/index.js';
import { rules } from '../components/targeting.js';
import { requireLogin } from '../services/auth.js';
import * as api from '../services/api.js';

await requireLogin();

// Field: [path in the data, label, type]. type is 'text', 'number', 'sprite', 'effects', 'tile'
// or an array of options (shown as a selector).
const categories = {
  towers: {
    label: 'Torres',
    data: towers,
    fields: [
      ['name', 'Nombre', 'text'],
      ['sprite', 'Sprite', 'sprite'],
      ['cost', 'Costo', 'number'],
      ['placeOn', 'Se coloca en', zones],
      ['weapon.range', 'Alcance (px)', 'number'],
      ['weapon.fireRate', 'Disparos por segundo', 'number'],
      ['weapon.targeting', 'Apunta a', Object.keys(rules)],
      ['weapon.projectile.sprite', 'Sprite del proyectil', 'sprite'],
      ['weapon.projectile.speed', 'Velocidad del proyectil', 'number'],
      ['weapon.projectile.effects', 'Efectos', 'effects'],
    ],
    template: (id) => ({
      name: id,
      sprite: id,
      cost: 50,
      placeOn: 'build',
      weapon: { range: 70, fireRate: 1, targeting: 'first', projectile: { sprite: 'ball', speed: 160, effects: [{ type: 'damage', amount: 10 }] } },
    }),
  },
  enemies: {
    label: 'Enemigos',
    data: enemies,
    fields: [
      ['name', 'Nombre', 'text'],
      ['sprite', 'Sprite', 'sprite'],
      ['hp', 'Vida', 'number'],
      ['speed', 'Velocidad (px/s)', 'number'],
      ['armor', 'Armadura', 'number'],
      ['reward', 'Recompensa (oro)', 'number'],
      ['damage', 'Daño por segundo a las cadenas', 'number'],
      ['movement', 'Movimiento', Object.keys(movements)],
    ],
    template: (id) => ({ name: id, sprite: id, hp: 50, speed: 20, armor: 0, reward: 5, damage: 1, movement: 'path' }),
  },
  items: {
    label: 'Barcos propios',
    data: items,
    fields: [
      ['name', 'Nombre', 'text'],
      ['sprite', 'Sprite', 'sprite'],
      ['cost', 'Costo', 'number'],
      ['placeOn', 'Se coloca en', zones],
      ['radius', 'Radio de activación (px)', 'number'],
      ['uses', 'Usos', 'number'],
      ['effects', 'Efectos', 'effects'],
    ],
    template: (id) => ({ name: id, sprite: id, cost: 30, placeOn: 'path', radius: 10, uses: 1, effects: [{ type: 'damage', amount: 10 }] }),
  },
  terrain: {
    label: 'Terreno',
    data: terrain,
    fields: [
      ['name', 'Nombre', 'text'],
      ['tile', 'Tile', 'tile'],
      ['sprite', 'PNG (reemplaza el tile)', 'sprite'],
      ['zone', 'Zona', ['', ...zones]],
    ],
    template: (id) => ({ name: id, tile: 0, zone: null }),
  },
};

const paramLabels = { amount: 'cantidad', dps: 'daño/s', duration: 'duración (s)', factor: 'factor', radius: 'radio (px)' };

const $ = (id) => document.getElementById(id);
let current = null;

const tilesImage = new Image();
tilesImage.src = 'assets/tiles/terrain.png';
tilesImage.onload = () => {
  // The page reloads after saving (Vite sees the data files change), so the selection lives in the URL.
  const [cat, id] = location.hash.slice(1).split('/');
  if (categories[cat]?.data[id]) current = { cat, id };
  render();
};

$('save').onclick = async () => {
  const body = Object.fromEntries(Object.entries(categories).map(([cat, c]) => [cat, c.data]));
  body.sprites = sprites;
  try {
    await api.saveData(body);
  } catch (e) {
    alert(e.message);
  }
};

function select(cat, id) {
  current = { cat, id };
  location.hash = `${cat}/${id}`;
  render();
}

function render() {
  $('lists').innerHTML = '';
  for (const [cat, c] of Object.entries(categories)) {
    const h = document.createElement('h3');
    h.textContent = c.label;
    const ul = document.createElement('ul');
    for (const [id, def] of Object.entries(c.data)) {
      const li = document.createElement('li');
      li.textContent = def.name;
      li.onclick = () => select(cat, id);
      ul.append(li);
    }
    const input = document.createElement('input');
    input.className = 'new';
    input.placeholder = 'id nuevo';
    const add = document.createElement('button');
    add.textContent = 'Agregar';
    add.onclick = () => {
      const id = input.value.trim();
      if (!id || c.data[id]) return;
      c.data[id] = c.template(id);
      select(cat, id);
    };
    $('lists').append(h, ul, input, add);
  }

  $('form').innerHTML = '';
  if (!current) return;
  const c = categories[current.cat];
  const def = c.data[current.id];
  const title = document.createElement('h2');
  title.textContent = `${c.label}: ${def.name} (${current.id})`;
  $('form').append(title);
  for (const [path, label, type] of c.fields) $('form').append(field(def, path, label, type));
}

function field(def, path, label, type) {
  const row = document.createElement('p');
  const name = document.createElement('label');
  name.textContent = label;
  row.append(name);

  if (type === 'effects') {
    row.append(effectsEditor(get(def, path)));
  } else if (type === 'sprite') {
    row.append(spriteEditor(def, path));
  } else if (type === 'tile') {
    const count = (tilesImage.width / TILE) * (tilesImage.height / TILE);
    row.append(selector([...Array(count).keys()], get(def, path), (v) => set(def, path, Number(v))));
    row.append(tilePreview(get(def, path)));
  } else if (Array.isArray(type)) {
    row.append(selector(type, get(def, path), (v) => set(def, path, v || null)));
  } else {
    const input = document.createElement('input');
    input.type = type;
    input.value = get(def, path);
    input.onchange = () => {
      set(def, path, type === 'number' ? Number(input.value) : input.value);
      render();
    };
    row.append(input);
  }
  return row;
}

function selector(options, value, onChange) {
  const s = document.createElement('select');
  for (const o of options) s.add(new Option(o === '' ? '(ninguna)' : o, o));
  s.value = value ?? '';
  s.onchange = () => {
    onChange(s.value);
    render();
  };
  return s;
}

function effectsEditor(list) {
  const box = document.createElement('div');
  list.forEach((effect, i) => {
    const row = document.createElement('div');
    row.className = 'effect';
    // Changing the type resets the params to the ones the new type uses.
    row.append(
      selector(Object.keys(effects), effect.type, (type) => {
        list[i] = { type };
        for (const p of effects[type].params) list[i][p] = 0;
      }),
    );
    for (const p of effects[effect.type].params) {
      const input = document.createElement('input');
      input.type = 'number';
      input.value = effect[p];
      input.onchange = () => (effect[p] = Number(input.value));
      row.append(` ${paramLabels[p] ?? p} `, input);
    }
    const remove = document.createElement('button');
    remove.textContent = 'Quitar';
    remove.onclick = () => {
      list.splice(i, 1);
      render();
    };
    row.append(' ', remove);
    box.append(row);
  });

  const add = document.createElement('button');
  add.className = 'effect';
  add.textContent = 'Agregar efecto';
  add.onclick = () => {
    list.push({ type: 'damage', amount: 0 });
    render();
  };
  box.append(add);
  return box;
}

// Sprite key + PNG upload. The image is saved right away; the key is registered in sprites.json on "Guardar todo".
function spriteEditor(def, path) {
  const box = document.createElement('span');
  const key = document.createElement('input');
  key.value = get(def, path) ?? '';
  key.onchange = () => {
    set(def, path, key.value);
    render();
  };

  const file = document.createElement('input');
  file.type = 'file';
  file.accept = 'image/png';
  file.onchange = async () => {
    try {
      sprites[key.value] = await api.uploadSprite(key.value, file.files[0]);
    } catch (e) {
      return alert(e.message);
    }
    render();
  };

  box.append(key, ' ', file);
  if (sprites[key.value]) {
    const img = document.createElement('img');
    // Timestamp so a re-uploaded image isn't served from cache.
    img.src = `${sprites[key.value]}?${Date.now()}`;
    box.append(img);
  }
  return box;
}

function tilePreview(tile) {
  const size = TILE * ZOOM;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const columns = tilesImage.width / TILE;
  ctx.drawImage(tilesImage, (tile % columns) * TILE, Math.floor(tile / columns) * TILE, TILE, TILE, 0, 0, size, size);
  return c;
}

// 'weapon.range' -> def.weapon.range
function get(obj, path) {
  return path.split('.').reduce((o, k) => o[k], obj);
}

function set(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => o[k], obj)[last] = value;
}
