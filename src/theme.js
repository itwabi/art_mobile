import React, { createContext, useContext, useMemo, useState } from 'react';

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

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const value = useMemo(
    () => ({
      mode,
      colors: mode === 'dark' ? dark : light,
      toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
    }),
    [mode]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

// Стили, зависящие от темы: useStyles(makeStyles), где makeStyles = (colors) => StyleSheet.create({...})
export function useStyles(factory) {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors]);
}
