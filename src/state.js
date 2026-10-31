import React, { createContext, useContext, useMemo, useState } from 'react';

const Ctx = createContext(null);

// Общее состояние (пока без сервера): вошёл ли пользователь и в каких челленджах участвует
export function AppProvider({ children }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [joined, setJoined] = useState([]);
  const value = useMemo(
    () => ({
      loggedIn,
      login: () => setLoggedIn(true),
      logout: () => { setLoggedIn(false); setJoined([]); },
      joined,
      join: (id) => setJoined((j) => (j.includes(id) ? j : [...j, id])),
      leave: (id) => setJoined((j) => j.filter((x) => x !== id)),
    }),
    [loggedIn, joined]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
