import { levels } from '../data/levels.js';
import { requireLogin } from '../services/auth.js';
import * as api from '../services/api.js';

await requireLogin();

const mapNames = await api.listMaps();
const table = document.getElementById('levels');

// One row per level: its number, the map it's played on, and a button to remove it.
function render() {
  table.replaceChildren();
  levels.forEach((level, i) => {
    const row = table.insertRow();
    row.insertCell().textContent = `Nivel ${i + 1}`;

    const select = document.createElement('select');
    for (const name of mapNames) select.add(new Option(name, name, false, name === level.map));
    select.onchange = () => (level.map = select.value);
    row.insertCell().append(select);

    const remove = document.createElement('button');
    remove.textContent = 'Quitar';
    remove.onclick = () => {
      levels.splice(i, 1);
      render();
    };
    row.insertCell().append(remove);
  });
}

document.getElementById('add').onclick = () => {
  levels.push({ map: mapNames[0] });
  render();
};

document.getElementById('save').onclick = async () => {
  try {
    await api.saveData({ levels });
    alert('Guardado');
  } catch (e) {
    alert(e.message);
  }
};

render();
