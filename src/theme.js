import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const light = {
  bg: '#FBF7F0',
  card: '#FFFFFF',
  ink: '#2B2622',
  muted: '#8A7F72',
  border: '#E3D9C8',
  header: '#F0E8DA',
  accent: '#E4572E',
  accentSoft: '#FBE3DA',
  placeholder: '#F3ECDF',
  overlay: 'rgba(0,0,0,0.4)',
};
export const dark = {
  bg: '#16130F',
  card: '#221E18',
  ink: '#F3ECE0',
  muted: '#A0958A',
  border: '#3A332A',
  header: '#2A251E',
  accent: '#EE6A40',
  accentSoft: '#3A2218',
  placeholder: '#2A251E',
  overlay: 'rgba(0,0,0,0.6)',
};
export const radius = { s: 10, m: 16, l: 24 };
export const space = { xs: 6, s: 10, m: 16, l: 24, xl: 32 };

const Ctx = createContext(null);
const THEME_KEY = 'art_theme_mode';

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const saved = Platform.OS === 'web'
          ? window.localStorage.getItem(THEME_KEY)
          : await SecureStore.getItemAsync(THEME_KEY);
        if (active && (saved === 'light' || saved === 'dark')) setMode(saved);
      } catch {}
    })();
    return () => { active = false; };
  }, []);

  const value = useMemo(
    () => ({
      mode,
      colors: mode === 'dark' ? dark : light,
      toggle: () => setMode((current) => {
        const next = current === 'dark' ? 'light' : 'dark';
        try {
          if (Platform.OS === 'web') window.localStorage.setItem(THEME_KEY, next);
          else SecureStore.setItemAsync(THEME_KEY, next).catch(() => {});
        } catch {}
        return next;
      }),
    }),
    [mode]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

export function useStyles(factory) {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors]);
}
