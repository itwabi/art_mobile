const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};


export function buildPlan(categories, count, order) {
  if (!categories.length) return [];
  if (order !== 'ordered') {
    const plan = [];
    let bag = [];
    while (plan.length < count) {
      if (!bag.length) {
        bag = shuffle(categories);

        if (plan.length && bag.length > 1 && bag[0] === plan[plan.length - 1]) bag.push(bag.shift());
      }
      plan.push(bag.shift());
    }
    return plan;
  }

  const base = Math.floor(count / categories.length);
  const extra = count % categories.length;
  return categories.flatMap((c, i) => Array(base + (i < extra ? 1 : 0)).fill(c));
}
