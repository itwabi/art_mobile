import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearToken, hasToken, loadToken, saveToken, setUnauthorizedHandler } from './api';

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);   
  const [user, setUser] = useState(null);      
  const [joined, setJoined] = useState([]);    
  const [works, setWorks] = useState([]);     

  const reset = useCallback(() => { setUser(null); setJoined([]); setWorks([]); }, []);

  const loadAccount = useCallback(async () => {
    const [me, mine, gallery] = await Promise.all([api.me(), api.myChallenges(), api.gallery()]);
    setUser(me);
    setJoined(mine.map((c) => c.id));
    setWorks(gallery);
  }, []);

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

    addAlbum: async (uris, categories) => {
      if (!uris.length) return;
      const item = await api.uploadAlbum(uris, categories);
      setWorks((w) => [item, ...w]);
    },

    attachChallengePhoto: async (uri, challengeId, topicId) => {
      const w = await api.uploadChallengeWork(uri, challengeId, topicId);
      api.gallery().then(setWorks).catch(() => {});
      return w;
    },

    removeWorks: async (ids) => {
      await Promise.all(ids.map((id) => api.deleteGalleryItem(id)));
      setWorks((w) => w.filter((x) => !ids.includes(x.id)));
    },
  }), [ready, user, joined, works]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
