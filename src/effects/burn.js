// Status effect: damage over time, ignores armor.
export default {
  params: ['dps', 'duration'],
  tint: 0xff8844,

  apply(scene, target, params) {
    target?.status.add('burn', params);
  },

  tick(target, dt, { dps }) {
    target.takeDamage(dps * dt, true);
  },
};
