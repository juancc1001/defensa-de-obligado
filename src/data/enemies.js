// Every enemy in the game. Edited from elements.html, see docs/TUTORIAL.md "Enemies".
import local from './enemies.json';
import { remote } from './remote.js';

export const enemies = remote.enemies ?? local;
