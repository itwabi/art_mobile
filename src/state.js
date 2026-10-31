import React, { createContext, useContext, useMemo, useRef, useState } from 'react';

const Ctx = createContext(null);

const pad = (n) => String(n).padStart(2, '0');
const today = () => {
  const d = new Date();
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};

// Общее состояние (пока без сервера): вход, участие в челленджах и галерея работ.
// Всё хранится в памяти и пропадает при перезапуске приложения — позже это переедет на бэкенд.
export function AppProvider({ children }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [joined, setJoined] = useState([]);
  const [works, setWorks] = useState([]);
  const counter = useRef(0);
  const nextId = () => ++counter.current;

  const value = useMemo(
    () => ({
      loggedIn,
      login: () => setLoggedIn(true),
      logout: () => { setLoggedIn(false); setJoined([]); setWorks([]); },
      joined,
      join: (id) => setJoined((j) => (j.includes(id) ? j : [...j, id])),
      leave: (id) => setJoined((j) => j.filter((x) => x !== id)),

      // Галерея. Элемент: { id, kind: 'sketch' | 'challenge', title, tags, date, images: [{ id, uri }] }
      works,

      // Фото после тренировки: все выбранные фото сохраняются одним альбомом
      addAlbum: (uris, categories) => {
        if (!uris.length) return;
        const item = {
          id: nextId(),
          kind: 'sketch',
          title: 'Тренировка',
          tags: categories && categories.length ? categories : ['Наброски'],
          date: today(),
          images: uris.map((uri) => ({ id: nextId(), uri })),
        };
        setWorks((w) => [item, ...w]);
      },

      // Фото к теме челленджа: если к теме уже есть фото, новое его заменяет
      setChallengeWork: ({ challengeId, challengeTitle, topicIndex, topicTitle, uri }) => {
        const item = {
          id: nextId(),
          kind: 'challenge',
          title: topicTitle,
          tags: [challengeTitle, topicTitle],
          date: today(),
          challengeId,
          topicIndex,
          images: [{ id: nextId(), uri }],
        };
        setWorks((w) => [
          item,
          ...w.filter((x) => !(x.kind === 'challenge' && x.challengeId === challengeId && x.topicIndex === topicIndex)),
        ]);
      },

      removeWorks: (ids) => setWorks((w) => w.filter((x) => !ids.includes(x.id))),
    }),
    [loggedIn, joined, works]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
