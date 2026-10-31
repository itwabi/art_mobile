import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Card, Label, Select, Placeholder } from '../components/ui';
import { PhotoViewer } from '../components/photos';
import { pickPhotos } from '../photos';
import { useApp } from '../state';
import { useTheme, useStyles, radius } from '../theme';
import { api } from '../api';
import { buildPlan } from '../plan';

export function SketchSettings({ navigation }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const [opts, setOpts] = useState(null);          // { categories, times, counts, orders } с сервера
  const [loadError, setLoadError] = useState(null);
  const [seconds, setSeconds] = useState(60);
  const [count, setCount] = useState(10);
  const [order, setOrder] = useState('random');
  const [picked, setPicked] = useState([]); // порядок = порядок выбора
  const toggle = (c) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  const load = () => {
    setLoadError(null);
    Promise.all([api.sketchCategories(), api.sketchOptions()])
      .then(([cats, o]) => {
        setOpts({ categories: cats.map((c) => c.name), times: o.times, counts: o.counts, orders: o.orders });
        setSeconds(o.defaults.seconds);
        setCount(o.defaults.count);
        setOrder(o.defaults.order);
        setPicked((p) => (p.length ? p : cats.length ? [cats[0].name] : []));
      })
      .catch((e) => setLoadError(e.message));
  };
  useEffect(load, []);

  const start = () => navigation.navigate('SketchSession', { plan: buildPlan(picked, count, order), seconds, categories: picked });

  if (loadError) {
    return (
      <Screen>
        <Card style={{ gap: 12 }}>
          <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 15 }}>{loadError}</Text>
          <Button title="Повторить" onPress={load} />
        </Card>
      </Screen>
    );
  }
  if (!opts) return <Screen><Text style={{ color: colors.muted, textAlign: 'center', marginTop: 40 }}>Загрузка…</Text></Screen>;
  const { categories, times: timeOptions, counts: countOptions, orders: orderOptions } = opts;

  return (
    <Screen scroll>
      <Card style={{ gap: 14 }}>
        <Select label="Время на кадр" value={seconds} options={timeOptions} onChange={setSeconds} />
        <Select label="Количество набросков" value={count} options={countOptions} onChange={setCount} />
        <Select label="Порядок показа" value={order} options={orderOptions} onChange={setOrder} />
        <View>
          <Label>Категории референсов (можно несколько)</Label>
          <View style={s.chips}>
            {categories.map((c) => {
              const idx = picked.indexOf(c);
              const on = idx >= 0;
              return (
                <Pressable key={c} onPress={() => toggle(c)} style={[s.chip, on && s.chipOn]}>
                  <Text style={[s.chipText, on && { color: '#fff' }]}>
                    {on && picked.length > 1 ? `${idx + 1}. ` : ''}{c}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {picked.length === 0 && <Text style={s.hint}>Выберите хотя бы одну категорию</Text>}
          {picked.length > 1 && order === 'ordered' && (
            <Text style={s.hint}>Порядок показа: {picked.join(' → ')}</Text>
          )}
        </View>
      </Card>
      <Button title="СТАРТ" variant="primary" icon="play" disabled={picked.length === 0} onPress={start} />
    </Screen>
  );
}

const fmt = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

export function SketchSession({ navigation, route }) {
  const s = useStyles(makeStyles);
  const { plan, seconds, categories = [] } = route.params;
  const { colors } = useTheme();
  const [refs, setRefs] = useState(null);   // { категория: [url, ...] }
  const [frames, setFrames] = useState([]); // [{ category, image }] — по кадру на каждый пункт плана
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(seconds);
  const startedAt = useRef(Date.now());

  const done = (count) => navigation.replace('SketchFinish', {
    count,
    seconds,
    categories,
    elapsed: Math.round((Date.now() - startedAt.current) / 1000),
  });
  const finish = () => done(i + 1);
  const next = () => {
    if (i + 1 >= plan.length) return done(plan.length);
    setI(i + 1);
    setLeft(seconds);
  };

  // Загружаем референсы и раскладываем по кадрам плана: внутри категории фото идут вперемешку и без повторов, пока не кончатся
  useEffect(() => {
    api.sketchReferences(categories)
      .catch(() => ({}))
      .then((data) => {
        const bags = {};
        const draw = (cat) => {
          const all = data[cat] || [];
          if (!all.length) return null;
          if (!bags[cat] || !bags[cat].length) bags[cat] = [...all].sort(() => Math.random() - 0.5);
          return bags[cat].pop();
        };
        const list = plan.map((cat) => ({ category: cat, image: draw(cat) }));
        list.forEach((f) => { if (f.image) Image.prefetch?.(f.image); });
        setFrames(list);
        setRefs(data);
        startedAt.current = Date.now();
      });
  }, []);

  // таймер стартует только когда референсы загружены
  useEffect(() => {
    if (!refs) return;
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [refs]);
  useEffect(() => {
    if (refs && left <= 0) next();
  }, [left]);

  if (!refs) return <Screen><Text style={{ color: colors.muted, textAlign: 'center', marginTop: 40 }}>Загружаем референсы…</Text></Screen>;
  const frame = frames[i];

  return (
    <Screen>
      <View style={s.timerWrap}>
        <View style={s.timer}><Text style={s.timerText}>{fmt(Math.max(left, 0))}</Text></View>
        <View style={s.progress}><View style={[s.progressFill, { width: `${(left / seconds) * 100}%` }]} /></View>
        <Text style={s.hint}>Кадр {i + 1} из {plan.length} · {plan[i]}</Text>
      </View>
      {frame?.image ? (
        <Image source={{ uri: frame.image }} style={[s.reference, { flex: 1, marginTop: 12 }]} resizeMode="contain" />
      ) : (
        <Placeholder text={`Нет референсов в категории «${plan[i]}»`} style={{ flex: 1, marginTop: 12 }} />
      )}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <Button title="Завершить" style={{ flex: 1 }} onPress={finish} />
        <Button title="Далее" icon="arrow-forward" variant="primary" style={{ flex: 1 }} onPress={next} />
      </View>
    </Screen>
  );
}

const plural = (n) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} набросок`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return `${n} наброска`;
  return `${n} набросков`;
};

export function SketchFinish({ navigation, route }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const { loggedIn, addAlbum } = useApp();
  const { count = 0, seconds = 0, elapsed, categories = [] } = route.params ?? {};
  const spent = elapsed ?? count * seconds;
  const time = spent < 60 ? 'меньше минуты' : `около ${Math.round(spent / 60)} мин`;

  const [items, setItems] = useState([]);      // выбранные фото: { uri, sent }
  const [status, setStatus] = useState(null);  // { text, error, needLogin, toWorks }
  const [viewer, setViewer] = useState(null);  // номер открытого фото

  const pending = items.filter((it) => !it.sent);

  // после входа в аккаунт убираем предупреждение «войдите в профиль»
  useEffect(() => {
    if (loggedIn) setStatus((st) => (st && st.needLogin ? null : st));
  }, [loggedIn]);

  const pick = async () => {
    if (!loggedIn) {
      return setStatus({ text: 'Нельзя прикрепить фото, пока вы не вошли в профиль.', error: true, needLogin: true });
    }
    const uris = await pickPhotos();
    if (!uris.length) return;
    setItems((p) => [...p, ...uris.map((uri) => ({ uri, sent: false }))]);
    setStatus(null);
  };
  const remove = (i) => {
    setItems((p) => p.filter((_, k) => k !== i));
    setStatus(null);
  };
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (!loggedIn) return pick();
    setSending(true);
    try {
      await addAlbum(pending.map((it) => it.uri), categories);
      setItems((p) => p.map((it) => ({ ...it, sent: true })));
      setStatus({ text: 'Фото сохранено. Его можно посмотреть в «Ваших работах».', toWorks: true });
    } catch (e) {
      setStatus({ text: e.message, error: true });
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen scroll>
      <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: colors.ink }}>Тренировка окончена</Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>{plural(count)} · {time}</Text>
      </Card>
      <View style={{ flex: 1 }} />
      <View style={{ gap: 12 }}>
        {items.length === 0 ? (
          <Button title="Прикрепить фото" icon="attach" onPress={pick} />
        ) : (
          <Card style={{ gap: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
              {items.map((it, i) => (
                <View key={`${it.uri}-${i}`} style={s.thumbWrap}>
                  <Pressable onPress={() => setViewer(i)}>
                    <Image source={{ uri: it.uri }} style={[s.thumb, it.sent && { opacity: 0.55 }]} />
                  </Pressable>
                  {it.sent ? (
                    <View style={s.sentTag}><Text style={s.sentText}>Прикреплено</Text></View>
                  ) : (
                    <Pressable accessibilityLabel="Убрать фото" onPress={() => remove(i)} style={s.removeBtn}>
                      <Ionicons name="close" size={14} color="#fff" />
                    </Pressable>
                  )}
                </View>
              ))}
              <Pressable accessibilityLabel="Добавить ещё фото" onPress={pick} style={s.addTile}>
                <Ionicons name="add" size={28} color={colors.muted} />
              </Pressable>
            </ScrollView>
            {pending.length > 0 && (
              <Button title={sending ? 'Отправляем…' : pending.length > 1 ? `Прикрепить (${pending.length})` : 'Прикрепить'} variant="primary" disabled={sending} onPress={send} />
            )}
          </Card>
        )}
        {status && !(status.needLogin && loggedIn) && (
          <View style={{ gap: 10, alignItems: 'flex-start' }}>
            <Text style={{ color: status.error ? colors.accent : colors.muted, fontSize: 15, fontWeight: '600' }}>{status.text}</Text>
            {status.needLogin && (
              <Button title="Войти в аккаунт" variant="primary" style={s.small} onPress={() => navigation.navigate('Profile', { screen: 'Login' })} />
            )}
            {status.toWorks && (
              <Button title="Открыть «Ваши работы»" style={s.small} onPress={() => navigation.navigate('Profile', { screen: 'MyWorks' })} />
            )}
          </View>
        )}
        <Button title="Выйти к настройкам" variant="primary" onPress={() => navigation.popToTop()} />
      </View>
      <PhotoViewer visible={viewer !== null} images={items.map((it) => it.uri)} index={viewer ?? 0} onClose={() => setViewer(null)} />
    </Screen>
  );
}

const makeStyles = (c) => StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.card },
  chipOn: { backgroundColor: c.accent, borderColor: c.accent },
  chipText: { fontSize: 15, color: c.ink, fontWeight: '600' },
  hint: { color: c.muted, marginTop: 8, fontSize: 14 },
  timerWrap: { alignItems: 'center' },
  timer: { backgroundColor: c.ink, paddingHorizontal: 32, paddingVertical: 10, borderRadius: radius.l },
  timerText: { color: c.bg, fontSize: 34, fontWeight: '800', fontVariant: ['tabular-nums'] },
  progress: { height: 6, alignSelf: 'stretch', backgroundColor: c.border, borderRadius: 3, marginTop: 14, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: c.accent },
  reference: { width: '100%', borderRadius: radius.m, backgroundColor: c.placeholder },
  thumbWrap: { width: 76, height: 76 },
  thumb: { width: 76, height: 76, borderRadius: radius.s, backgroundColor: c.placeholder },
  removeBtn: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  sentTag: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', borderBottomLeftRadius: radius.s, borderBottomRightRadius: radius.s, paddingVertical: 2 },
  sentText: { color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  addTile: { width: 76, height: 76, borderRadius: radius.s, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  small: { paddingVertical: 9, paddingHorizontal: 14 },
});