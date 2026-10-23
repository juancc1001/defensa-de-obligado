import { effects } from '../effects/index.js';

// Timed effects (burn, slow...) living on an entity. Re-applying one refreshes it.
export default class StatusEffects {
  constructor(owner) {
    this.owner = owner;
    this.active = new Map();
  }

  add(type, params) {
    this.active.set(type, { params, remaining: params.duration });
  }

  speedMultiplier() {
    let m = 1;
    for (const [type, s] of this.active) {
      m *= effects[type].speedMultiplier?.(s.params) ?? 1;
    }
    return m;
  }

  update(dt) {
    let tint = null;
    for (const [type, s] of this.active) {
      effects[type].tick?.(this.owner, dt, s.params);
      if (!this.owner.active) return;
      s.remaining -= dt;
      if (s.remaining <= 0) this.active.delete(type);
      else tint = effects[type].tint ?? tint;
    }
    if (tint === null) this.owner.clearTint();
    else this.owner.setTint(tint);
  }
}
