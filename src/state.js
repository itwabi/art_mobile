import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearToken, hasToken, loadToken, saveToken, setUnauthorizedHandler } from './api';

const Ctx = createContext(null);

// Общее состояние: сессия, участие в челленджах и галерея работ. Всё хранится на сервере,
// здесь только кэш последнего ответа. Токен сохраняется на устройстве.
export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);   // пытались ли восстановить сессию
  const [user, setUser] = useState(null);      // { nickname, streak_days } или null
  const [joined, setJoined] = useState([]);    // id челленджей, в которых участвует пользователь
  const [works, setWorks] = useState([]);      // элементы галереи: { id, kind, title, tags, date, images: [{id, uri}] }

  const reset = useCallback(() => { setUser(null); setJoined([]); setWorks([]); }, []);

  const loadAccount = useCallback(async () => {
    const [me, mine, gallery] = await Promise.all([api.me(), api.myChallenges(), api.gallery()]);
    setUser(me);
    setJoined(mine.map((c) => c.id));
    setWorks(gallery);
  }, []);

  // при старте приложения: если токен сохранён — подтягиваем профиль
  useEffect(() => {
    setUnauthorizedHandler(() => { clearToken(); reset(); });
    (async () => {
      try {
        if (await loadToken()) await loadAccount();
      } catch (e) {
        if (e.status === 401) await clearToken();
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const value = useMemo(() => ({
    ready,
    loggedIn: !!user,
    user,

    // Вход/регистрация бросают Error с текстом от сервера — экран покажет его пользователю
    login: async (nickname, password) => {
      const res = await api.login(nickname, password);
      await saveToken(res.token);
      await loadAccount();
    },
    register: async (nickname, password) => {
      const res = await api.register(nickname, password);
      await saveToken(res.token);
      await loadAccount();
    },
    logout: async () => {
      try { if (hasToken()) await api.logout(); } catch {}
      await clearToken();
      reset();
    },

    joined,
    join: async (id) => { await api.join(id); setJoined((j) => (j.includes(id) ? j : [...j, id])); },
    leave: async (id) => { await api.leave(id); setJoined((j) => j.filter((x) => x !== id)); },

    works,
    refreshWorks: async () => setWorks(await api.gallery()),

    // Фото после тренировки: все выбранные фото уходят одним альбомом
    addAlbum: async (uris, categories) => {
      if (!uris.length) return;
      const item = await api.uploadAlbum(uris, categories);
      setWorks((w) => [item, ...w]);
    },

    // Фото к теме челленджа (новое заменяет старое — это делает сервер). Галерею обновляем с сервера
    attachChallengePhoto: async (uri, challengeId, topicId) => {
      const w = await api.uploadChallengeWork(uri, challengeId, topicId);
      api.gallery().then(setWorks).catch(() => {});
      return w;
    },

    // Удаление: сервер удаляет альбом целиком, поэтому передаём id элементов галереи
    removeWorks: async (ids) => {
      await Promise.all(ids.map((id) => api.deleteGalleryItem(id)));
      setWorks((w) => w.filter((x) => !ids.includes(x.id)));
    },
  }), [ready, user, joined, works]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
