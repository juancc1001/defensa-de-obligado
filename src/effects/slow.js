// Status effect: multiplies speed by `factor` while active.
export default {
  params: ['factor', 'duration'],
  tint: 0x88bbff,

  apply(scene, target, params) {
    target?.status.add('slow', params);
  },

  speedMultiplier({ factor }) {
    return factor;
  },
};
