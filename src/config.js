export const TILE = 16;
// The world is drawn at ZOOM; the HUD (UIScene) is not.
export const ZOOM = 2;
export const WIDTH = 30 * TILE * ZOOM;
export const HEIGHT = 17 * TILE * ZOOM;
// Mouse wheel zoom in levels, towards the cursor. Dragging moves around the map.
// Zoomed out shows at most MAX_VIEW_TILES tiles across, or the whole map if it's smaller.
export const MAX_VIEW_TILES = 50;
export const MAX_ZOOM = 4;
