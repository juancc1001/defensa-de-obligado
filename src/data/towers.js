// Every tower in the game. Edited from elements.html, see docs/TUTORIAL.md "Towers".
import local from './towers.json';
import { remote } from './remote.js';

export const towers = remote.towers ?? local;
