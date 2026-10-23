import Phaser from 'phaser';

// Each rule returns a sort function: the best target ends up first.
export const rules = {
  first: () => (a, b) => b.progress - a.progress,
  last: () => (a, b) => a.progress - b.progress,
  strongest: () => (a, b) => b.hp - a.hp,
  closest: (from) => (a, b) => dist(from, a) - dist(from, b),
};

function dist(a, b) {
  return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
}

export function findTarget(candidates, from, range, rule = 'first') {
  const inRange = candidates.filter((c) => dist(from, c) <= range);
  return inRange.sort(rules[rule](from))[0] ?? null;
}
