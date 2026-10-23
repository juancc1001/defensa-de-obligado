import damage from './damage.js';
import burn from './burn.js';
import slow from './slow.js';
import explode from './explode.js';

// Effect `type` names used in data files -> implementation.
export const effects = { damage, burn, slow, explode };

// ctx: { x, y, source } where the effect happened (projectile impact, item position...).
// target can be null, e.g. a projectile whose target died mid-flight.
export function applyEffects(scene, list, target, ctx) {
  for (const params of list) {
    effects[params.type].apply(scene, target, params, ctx);
  }
}
