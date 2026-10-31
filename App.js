import React from 'react';
import { View, Pressable, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './src/navigation';
import { ThemeProvider, useTheme } from './src/theme';
import { AppProvider } from './src/state';

// Только веб: значок луна/солнце в правом верхнем углу переключает тему
function ThemeToggle() {
  const { mode, toggle, colors } = useTheme();
  return (
    <Pressable
      onPress={toggle}
      accessibilityLabel="Переключить тему"
      style={{ position: 'absolute', top: 12, right: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
    >
      <Ionicons name={mode === 'dark' ? 'sunny' : 'moon'} size={20} color={colors.ink} />
    </Pressable>
  );
}

function Root() {
  const { mode } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Navigation />
      {Platform.OS === 'web' && <ThemeToggle />}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <Root />
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
