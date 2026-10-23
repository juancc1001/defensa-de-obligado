export default {
  params: ['amount'],

  apply(scene, target, { amount }) {
    target?.takeDamage(amount);
  },
};
