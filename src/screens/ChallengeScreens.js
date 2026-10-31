import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Card, Label, Select } from '../components/ui';
import { PhotoViewer } from '../components/photos';
import { pickPhotos } from '../photos';
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

const PREVIEW = 8; // сколько тем показываем, пока список свёрнут

export function ChallengeDetail({ navigation, route }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const { loggedIn, joined, join, leave, works, setChallengeWork } = useApp();
  const [warn, setWarn] = useState(false);
  const [showAll, setShowAll] = useState(false);   // развёрнут ли список тем
  const [panel, setPanel] = useState(false);       // открыта ли форма «Прикрепить фото»
  const [topic, setTopic] = useState(null);        // тема, выбранная в форме (null = первая без фото)
  const [photo, setPhoto] = useState(null);        // выбранное фото
  const [status, setStatus] = useState(null);      // { text, error }
  const [viewer, setViewer] = useState(null);      // фото, открытое на весь экран
  const c = allChallenges.find((x) => x.id === route.params?.id) ?? allChallenges[0];
  const isIn = loggedIn && joined.includes(c.id);
  const onJoin = () => (loggedIn ? join(c.id) : setWarn(true)); // без входа участвовать нельзя

  const mine = works.filter((w) => w.kind === 'challenge' && w.challengeId === c.id);
  const workOf = (k) => mine.find((w) => w.topicIndex === k);
  const firstFree = () => {
    const k = c.topics.findIndex((_, i) => !workOf(i));
    return k < 0 ? 0 : k;
  };
  const selected = topic ?? firstFree();

  const openPanel = (k) => {
    setPanel(true);
    setTopic(k);
    setStatus(null);
  };
  const choose = async () => {
    const [uri] = await pickPhotos({ multiple: false });
    if (uri) { setPhoto(uri); setStatus(null); }
  };
  const upload = () => {
    if (!photo) return setStatus({ text: 'Сначала выберите фото', error: true });
    setChallengeWork({ challengeId: c.id, challengeTitle: c.title, topicIndex: selected, topicTitle: c.topics[selected], uri: photo });
    setStatus({ text: `Фото прикреплено к теме «${c.topics[selected]}»`, error: false });
    setPhoto(null);
    setTopic(null);
  };
  const onLeave = () => {
    leave(c.id);
    setPanel(false);
    setStatus(null);
  };

  const rows = showAll ? c.topics : c.topics.slice(0, PREVIEW);

  return (
    <Screen scroll>
      <Text style={s.h1}>{c.title}</Text>
      <Card><Label>ОПИСАНИЕ И УСЛОВИЯ</Label><Text style={{ fontSize: 16, color: colors.ink, lineHeight: 23 }}>{c.desc}</Text></Card>
      <Card style={{ gap: 4 }}>
        <Label>СПИСОК ТЕМ</Label>
        {rows.map((t, k) => {
          const w = isIn ? workOf(k) : null;
          return (
            <View key={k} style={s.topic}>
              <Text style={{ flex: 1, fontSize: 15, color: colors.ink }}>{t}</Text>
              {w ? (
                <Pressable accessibilityLabel="Открыть фото" onPress={() => setViewer(w.images[0].uri)}>
                  <Image source={{ uri: w.images[0].uri }} style={s.topicThumb} />
                </Pressable>
              ) : isIn ? (
                <Pressable accessibilityLabel="Прикрепить фото к теме" hitSlop={8} onPress={() => openPanel(k)}>
                  <Ionicons name="image-outline" size={22} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>
          );
        })}
        {c.topics.length > PREVIEW && (
          <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
            <Button
              title={showAll ? 'Свернуть список' : `Показать все темы (${c.topics.length})`}
              style={s.noticeBtn}
              onPress={() => setShowAll(!showAll)}
            />
          </View>
        )}
      </Card>
      {isIn ? (
        <View style={{ gap: 12 }}>
          <Button title="Прикрепить фото" icon="attach" onPress={() => { setPanel(!panel); setStatus(null); }} />
          {panel && (
            <Card style={{ gap: 14 }}>
              <Select
                label="Тема"
                value={selected}
                options={c.topics.map((t, k) => ({ value: k, label: `${workOf(k) ? '✓ ' : ''}${t}` }))}
                onChange={(v) => { setTopic(v); setStatus(null); }}
              />
              <View style={{ gap: 10 }}>
                <Label>Фото рисунка</Label>
                {photo ? (
                  <Pressable onPress={() => setViewer(photo)}>
                    <Image source={{ uri: photo }} style={s.preview} resizeMode="cover" />
                  </Pressable>
                ) : null}
                <Button title={photo ? 'Выбрать другое фото' : 'Выбрать фото'} icon="image-outline" onPress={choose} />
              </View>
              <Button title="Загрузить" variant="primary" onPress={upload} />
              {status ? (
                <Text style={{ color: status.error ? colors.accent : colors.muted, fontSize: 15, fontWeight: '600' }}>{status.text}</Text>
              ) : null}
              <Text style={{ color: colors.muted, fontSize: 14 }}>Если к теме уже есть фото, новое заменит его.</Text>
            </Card>
          )}
          <Button title="Отменить участие" variant="danger" onPress={onLeave} />
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
      <PhotoViewer visible={viewer !== null} images={viewer ? [viewer] : []} onClose={() => setViewer(null)} />
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
  topicThumb: { width: 38, height: 38, borderRadius: 8, backgroundColor: c.placeholder },
  preview: { width: '100%', height: 180, borderRadius: radius.m, backgroundColor: c.placeholder },
});
