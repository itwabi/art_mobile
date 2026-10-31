import React, { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { SketchSettings, SketchSession, SketchFinish } from '../screens/SketchScreens';
import { GenerateSetup, GenerateResult } from '../screens/GenerateScreens';
import { ChallengeGallery, ChallengeList, ChallengeDetail } from '../screens/ChallengeScreens';
import { ProfileHome, AppSettings, MyChallenges, SavedGenerations, MyWorks, MyWork } from '../screens/ProfileScreens';

const Tab = createBottomTabNavigator();

function mk(screens) {
  const Stack = createNativeStackNavigator();
  return function StackNav() {
    const { colors } = useTheme();
    const opts = useMemo(() => ({
      headerStyle: { backgroundColor: colors.header },
      headerTitleStyle: { fontWeight: '800', color: colors.ink },
      headerTintColor: colors.ink,
      headerShadowVisible: false,
      headerBackVisible: false,
      headerTitleAlign: 'center',
      contentStyle: { backgroundColor: colors.bg },
    }), [colors]);
    return (
      <Stack.Navigator screenOptions={opts}>
        {screens.map(([name, comp, title]) => <Stack.Screen key={name} name={name} component={comp} options={{ title }} />)}
      </Stack.Navigator>
    );
  };
}

const SketchStack = mk([
  ['SketchSettings', SketchSettings, 'Настройка тренировки'],
  ['SketchSession', SketchSession, 'Тренировка'],
  ['SketchFinish', SketchFinish, 'Результат'],
]);
const GenerateStack = mk([
  ['GenerateSetup', GenerateSetup, 'Случайная генерация'],
  ['GenerateResult', GenerateResult, 'Случайная генерация'],
]);
const ChallengeStack = mk([
  ['ChallengeGallery', ChallengeGallery, 'Галерея челленджей'],
  ['ChallengeList', ChallengeList, 'Челленджи'],
  ['ChallengeDetail', ChallengeDetail, 'Челлендж'],
]);
const ProfileStack = mk([
  ['ProfileHome', ProfileHome, 'Профиль'],
  ['AppSettings', AppSettings, 'Настройки приложения'],
  ['MyChallenges', MyChallenges, 'Ваши челленджи'],
  ['SavedGenerations', SavedGenerations, 'Сохраненные генерации'],
  ['MyWorks', MyWorks, 'Ваши работы'],
  ['MyWork', MyWork, 'Работа'],
]);

const tabs = [
  ['Sketch', SketchStack, 'Наброски', 'timer-outline'],
  ['Generate', GenerateStack, 'Генерация', 'bulb-outline'],
  ['Challenges', ChallengeStack, 'Челленджи', 'color-palette-outline'],
  ['Profile', ProfileStack, 'Профиль', 'person-outline'],
];

export default function Navigation() {
  const { width } = useWindowDimensions();
  const { colors, mode } = useTheme();
  const wide = width >= 900; // веб на большом экране: боковое меню вместо нижнего
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer theme={{ ...base, colors: { ...base.colors, background: colors.bg, card: colors.card, text: colors.ink, border: colors.border, primary: colors.accent } }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarPosition: wide ? 'left' : 'bottom',
          tabBarLabelPosition: wide ? 'beside-icon' : undefined,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: wide
            ? { backgroundColor: colors.card, borderColor: colors.border, width: 240, paddingTop: 12 }
            : { backgroundColor: colors.card, borderColor: colors.border },
          tabBarActiveBackgroundColor: wide ? colors.accentSoft : undefined,
          tabBarItemStyle: wide ? { borderRadius: 12, marginHorizontal: 10, marginVertical: 2, justifyContent: 'flex-start', paddingHorizontal: 12 } : undefined,
          tabBarLabelStyle: { fontWeight: '600' },
        }}
      >
        {tabs.map(([name, comp, label, icon]) => (
          <Tab.Screen key={name} name={name} component={comp}
            options={{ title: label, tabBarIcon: ({ color, size }) => <Ionicons name={icon} size={size} color={color} /> }} />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
