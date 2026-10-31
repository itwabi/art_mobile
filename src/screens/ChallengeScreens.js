import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Card, Label } from '../components/ui';
import { useTheme, useStyles, radius } from '../theme';
import { useApp } from '../state';
import { calendarChallenges, permanentChallenges, allChallenges } from '../data/mock';

export function ChallengeGallery({ navigation }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const Big = ({ title, sub, icon, kind }) => (
    <Pressable onPress={() => navigation.navigate('ChallengeList', { kind })} style={({ pressed }) => [s.big, pressed && { opacity: 0.8 }]}>
      <Ionicons name={icon} size={34} color={colors.accent} />
      <Text style={s.bigTitle}>{title}</Text>
      <Text style={{ color: colors.muted }}>{sub}</Text>
    </Pressable>
  );
  return (
    <Screen>
      <View style={{ gap: 16, marginTop: 12 }}>
        <Big kind="calendar" icon="calendar-outline" title="Календарные челленджи" sub="Сезонные марафоны с датами" />
        <Big kind="permanent" icon="infinite-outline" title="Постоянные челленджи" sub="Без временных ограничений" />
      </View>
    </Screen>
  );
}

export function ChallengeList({ navigation, route }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const list = route.params?.kind === 'permanent' ? permanentChallenges : calendarChallenges;
  const [i, setI] = useState(0);
  const c = list[i];
  const go = (d) => setI((x) => (x + d + list.length) % list.length);
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={s.carousel}>
          <Pressable onPress={() => go(-1)} hitSlop={10}><Ionicons name="chevron-back" size={34} color={colors.ink} /></Pressable>
          <Card style={s.slide}>
            <Text style={s.slideTitle}>{c.title}</Text>
            {c.dates
              ? <Text style={{ color: colors.muted, marginTop: 6, textAlign: 'center' }}>Даты проведения:{'\n'}{c.dates}</Text>
              : <Text style={{ color: colors.muted, marginTop: 6 }}>Без ограничения по датам</Text>}
          </Card>
          <Pressable onPress={() => go(1)} hitSlop={10}><Ionicons name="chevron-forward" size={34} color={colors.ink} /></Pressable>
        </View>
        <View style={s.dots}>
          {list.map((_, k) => <View key={k} style={[s.dot, k === i && { backgroundColor: colors.accent }]} />)}
        </View>
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Button title="Подробнее" variant="primary" onPress={() => navigation.navigate('ChallengeDetail', { id: c.id })} style={{ minWidth: 180 }} />
        </View>
      </View>
    </Screen>
  );
}

export function ChallengeDetail({ navigation, route }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const { loggedIn, joined, join, leave } = useApp();
  const [warn, setWarn] = useState(false);
  const c = allChallenges.find((x) => x.id === route.params?.id) ?? allChallenges[0];
  const isIn = loggedIn && joined.includes(c.id);
  const onJoin = () => (loggedIn ? join(c.id) : setWarn(true)); // без входа участвовать нельзя
  return (
    <Screen scroll>
      <Text style={s.h1}>{c.title}</Text>
      <Card><Label>ОПИСАНИЕ И УСЛОВИЯ</Label><Text style={{ fontSize: 16, color: colors.ink, lineHeight: 23 }}>{c.desc}</Text></Card>
      <Card style={{ gap: 4 }}>
        <Label>СПИСОК ТЕМ</Label>
        {c.topics.slice(0, 8).map((t, k) => (
          <View key={k} style={s.topic}>
            <Text style={{ flex: 1, fontSize: 15, color: colors.ink }}>{t}</Text>
            {isIn ? <Ionicons name="image-outline" size={20} color={colors.muted} /> : null}
          </View>
        ))}
        <Text style={{ color: colors.muted, marginTop: 6 }}>… и ещё {c.topics.length - 8}</Text>
      </Card>
      {isIn ? (
        <View style={{ gap: 12 }}>
          <Button title="Прикрепить фото" icon="attach" />
          <Button title="Отменить участие" variant="danger" onPress={() => leave(c.id)} />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {warn && !loggedIn && (
            <View style={s.notice}>
              <Ionicons name="alert-circle-outline" size={22} color={colors.accent} />
              <View style={{ flex: 1, gap: 10, alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>Нельзя участвовать в челлендже, пока вы не вошли в профиль.</Text>
                <Button title="Войти в аккаунт" variant="primary" style={s.noticeBtn} onPress={() => navigation.navigate('Profile')} />
              </View>
            </View>
          )}
          <Button title="Участвовать" variant="primary" onPress={onJoin} />
        </View>
      )}
    </Screen>
  );
}

const makeStyles = (c) => StyleSheet.create({
  big: { backgroundColor: c.card, borderRadius: radius.l, borderWidth: 1, borderColor: c.border, paddingVertical: 34, alignItems: 'center', gap: 8 },
  bigTitle: { fontSize: 20, fontWeight: '800', color: c.ink },
  carousel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slide: { flex: 1, minHeight: 170, alignItems: 'center', justifyContent: 'center' },
  slideTitle: { fontSize: 24, fontWeight: '800', color: c.ink, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.border },
  h1: { fontSize: 26, fontWeight: '800', color: c.ink },
  notice: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: radius.m, borderWidth: 1.5, borderColor: c.accent, backgroundColor: c.accentSoft },
  noticeBtn: { paddingVertical: 9, paddingHorizontal: 14 },
  topic: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
});
