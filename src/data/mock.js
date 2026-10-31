export const categories = ['Позы', 'Анатомия', 'Портреты', 'Руки', 'Животные', 'Пейзажи'];
export const timeOptions = [
  { value: 60, label: '1 минута' },
  { value: 180, label: '3 минуты' },
  { value: 300, label: '5 минут' },
];
export const countOptions = [5, 10, 15, 20, 25, 30].map((n) => ({ value: n, label: `${n} набросков` }));
export const orderOptions = [
  { value: 'random', label: 'Случайный' },
  { value: 'sequence', label: 'По порядку выбора' },
];

export const calendarChallenges = [
  { id: 'c1', title: 'Inktober', dates: '01.10.2026 – 31.10.2026', desc: 'Один рисунок тушью в день в течение октября. Тема дня берётся из официального списка. Допустимы любые материалы, но основа — линия и тушь.', topics: Array.from({ length: 31 }, (_, i) => `День ${i + 1}: тема`) },
  { id: 'c2', title: 'MerMay', dates: '01.05.2026 – 31.05.2026', desc: 'Майский марафон русалок: рисуем по одному персонажу в день.', topics: Array.from({ length: 31 }, (_, i) => `День ${i + 1}: тема`) },
  { id: 'c3', title: 'Drawtober', dates: '01.10.2026 – 31.10.2026', desc: 'Свободный октябрьский марафон без жёстких правил.', topics: Array.from({ length: 31 }, (_, i) => `День ${i + 1}: тема`) },
];
export const permanentChallenges = [
  { id: 'p1', title: '100 дней рисования', dates: null, desc: 'Рисуйте минимум 15 минут каждый день в течение 100 дней.', topics: Array.from({ length: 10 }, (_, i) => `Задание ${i + 1}`) },
  { id: 'p2', title: 'Скетчбук-марафон', dates: null, desc: 'Одна страница скетчбука в день на любую тему.', topics: Array.from({ length: 10 }, (_, i) => `Задание ${i + 1}`) },
];

export const allChallenges = [...calendarChallenges, ...permanentChallenges];
export const savedGenerations = [
  { id: 'g1', title: 'Лесной дух' },
  { id: 'g2', title: 'Космический кот' },
  { id: 'g3', title: 'Старая башня' },
  { id: 'g4', title: 'Рыбацкая лодка' },
];
export const generated = {
  topic: 'Заброшенная библиотека',
  idea: 'Лиса, читающая книгу при свете светлячков',
  palette: ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'],
};
export const workColors = ['#F4A261', '#2A9D8F', '#E9C46A', '#264653', '#E76F51', '#8AB17D', '#B5838D', '#6D597A', '#E5989B'];
