const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Возвращает список категорий по кадрам: ['Руки', 'Позы', 'Животные', 'Руки', ...]
// categories — в порядке выбора пользователем.
export function buildPlan(categories, count, order) {
  if (!categories.length) return [];
  if (order === 'random') {
    const plan = [];
    let bag = [];
    while (plan.length < count) {
      if (!bag.length) {
        bag = shuffle(categories);
        // не ставим одну и ту же категорию подряд на стыке кругов
        if (plan.length && bag.length > 1 && bag[0] === plan[plan.length - 1]) bag.push(bag.shift());
      }
      plan.push(bag.shift());
    }
    return plan;
  }
  // по порядку выбора: сначала все кадры первой категории, потом второй и т.д.
  const base = Math.floor(count / categories.length);
  const extra = count % categories.length;
  return categories.flatMap((c, i) => Array(base + (i < extra ? 1 : 0)).fill(c));
}
