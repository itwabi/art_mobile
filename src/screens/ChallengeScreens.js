import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Card, Label, Select } from '../components/ui';
import { PhotoViewer } from '../components/photos';
import { pickPhotos } from '../photos';
import { useTheme, useStyles, radius } from '../theme';
import { useApp } from '../state';
import { api } from '../api';

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

const Loading = () => {
  const { colors } = useTheme();
  return <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 40 }}>Загрузка…</Text>;
};
const ErrorBox = ({ text, onRetry }) => {
  const { colors } = useTheme();
  return (
    <Card style={{ gap: 12, marginTop: 12 }}>
      <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 15 }}>{text}</Text>
      {onRetry ? <Button title="Повторить" onPress={onRetry} /> : null}
    </Card>
  );
};

export function ChallengeList({ navigation, route }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const kind = route.params?.kind === 'permanent' ? 'permanent' : 'calendar';
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [i, setI] = useState(0);
  const load = () => {
    setError(null);
    api.challenges(kind).then(setList).catch((e) => setError(e.message));
  };
  useEffect(load, [kind]);

  if (error) return <Screen><ErrorBox text={error} onRetry={load} /></Screen>;
  if (!list) return <Screen><Loading /></Screen>;
  if (!list.length) return <Screen><Card><Text style={{ color: colors.muted, textAlign: 'center' }}>Челленджей пока нет</Text></Card></Screen>;

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
  const { loggedIn, joined, join, leave, attachChallengePhoto } = useApp();
  const id = route.params?.id;
  const [c, setC] = useState(null);                // { id, title, dates, description, topics: [{id, title}] }
  const [loadError, setLoadError] = useState(null);
  const [mine, setMine] = useState([]);            // мои фото к темам этого челленджа: { topic_id, uri, ... }
  const [warn, setWarn] = useState(false);
  const [showAll, setShowAll] = useState(false);   // развёрнут ли список тем
  const [panel, setPanel] = useState(false);       // открыта ли форма «Прикрепить фото»
  const [topic, setTopic] = useState(null);        // id темы, выбранной в форме (null = первая без фото)
  const [photo, setPhoto] = useState(null);        // выбранное фото
  const [status, setStatus] = useState(null);      // { text, error }
  const [viewer, setViewer] = useState(null);      // фото, открытое на весь экран
  const [busy, setBusy] = useState(false);

  const isIn = loggedIn && c && joined.includes(c.id);

  const loadMine = () => api.challengeWorks(id).then(setMine).catch(() => {});
  const load = () => {
    setLoadError(null);
    api.challenge(id).then(setC).catch((e) => setLoadError(e.message));
  };
  useEffect(load, [id]);
  useEffect(() => { if (loggedIn && isIn) loadMine(); else setMine([]); }, [loggedIn, isIn, id]);

  if (loadError) return <Screen><ErrorBox text={loadError} onRetry={load} /></Screen>;
  if (!c) return <Screen><Loading /></Screen>;

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); } catch (e) { setStatus({ text: e.message, error: true }); } finally { setBusy(false); }
  };

  const onJoin = () => (loggedIn ? run(() => join(c.id)) : setWarn(true)); // без входа участвовать нельзя
  const workOf = (topicId) => mine.find((w) => w.topic_id === topicId);
  const firstFree = () => (c.topics.find((t) => !workOf(t.id)) ?? c.topics[0])?.id;
  const selected = topic ?? firstFree();
  const selectedTitle = c.topics.find((t) => t.id === selected)?.title;

  const openPanel = (topicId) => { setPanel(true); setTopic(topicId); setStatus(null); };
  const choose = async () => {
    const [uri] = await pickPhotos({ multiple: false });
    if (uri) { setPhoto(uri); setStatus(null); }
  };
  const upload = () => {
    if (!photo) return setStatus({ text: 'Сначала выберите фото', error: true });
    run(async () => {
      await attachChallengePhoto(photo, c.id, selected);
      await loadMine();
      setStatus({ text: `Фото прикреплено к теме «${selectedTitle}»`, error: false });
      setPhoto(null);
      setTopic(null);
    });
  };
  const onLeave = () => run(async () => {
    await leave(c.id);
    setPanel(false);
    setStatus(null);
  });

  const rows = showAll ? c.topics : c.topics.slice(0, PREVIEW);

  return (
    <Screen scroll>
      <Text style={s.h1}>{c.title}</Text>
      <Card><Label>ОПИСАНИЕ И УСЛОВИЯ</Label><Text style={{ fontSize: 16, color: colors.ink, lineHeight: 23 }}>{c.description}</Text></Card>
      <Card style={{ gap: 4 }}>
        <Label>СПИСОК ТЕМ</Label>
        {rows.map((t) => {
          const w = isIn ? workOf(t.id) : null;
          return (
            <View key={t.id} style={s.topic}>
              <Text style={{ flex: 1, fontSize: 15, color: colors.ink }}>{t.title}</Text>
              {w ? (
                <Pressable accessibilityLabel="Открыть фото" onPress={() => setViewer(w.uri)}>
                  <Image source={{ uri: w.uri }} style={s.topicThumb} />
                </Pressable>
              ) : isIn ? (
                <Pressable accessibilityLabel="Прикрепить фото к теме" hitSlop={8} onPress={() => openPanel(t.id)}>
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
                options={c.topics.map((t) => ({ value: t.id, label: `${workOf(t.id) ? '✓ ' : ''}${t.title}` }))}
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
              <Button title={busy ? 'Загружаем…' : 'Загрузить'} variant="primary" disabled={busy} onPress={upload} />
              {status ? (
                <Text style={{ color: status.error ? colors.accent : colors.muted, fontSize: 15, fontWeight: '600' }}>{status.text}</Text>
              ) : null}
              <Text style={{ color: colors.muted, fontSize: 14 }}>Если к теме уже есть фото, новое заменит его.</Text>
            </Card>
          )}
          <Button title="Отменить участие" variant="danger" disabled={busy} onPress={onLeave} />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {warn && !loggedIn && (
            <View style={s.notice}>
              <Ionicons name="alert-circle-outline" size={22} color={colors.accent} />
              <View style={{ flex: 1, gap: 10, alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>Нельзя участвовать в челлендже, пока вы не вошли в профиль.</Text>
                <Button title="Войти в аккаунт" variant="primary" style={s.noticeBtn} onPress={() => navigation.navigate('Profile', { screen: 'Login' })} />
              </View>
            </View>
          )}
          {status?.error ? <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '600' }}>{status.text}</Text> : null}
          <Button title="Участвовать" variant="primary" disabled={busy} onPress={onJoin} />
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
