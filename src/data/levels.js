// The story's levels in order (level 1 first), each one played on a map. Edited from story.html.
import local from './levels.json';
import { remote } from './remote.js';

export const levels = remote.levels ?? local;
