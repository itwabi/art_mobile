import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Screen, Button, Card, Label, Select, Placeholder } from '../components/ui';
import { useTheme, useStyles, radius } from '../theme';
import { categories, timeOptions, countOptions, orderOptions } from '../data/mock';
import { buildPlan } from '../plan';

export function SketchSettings({ navigation }) {
  const s = useStyles(makeStyles);
  const [seconds, setSeconds] = useState(60);
  const [count, setCount] = useState(10);
  const [order, setOrder] = useState('random');
  const [picked, setPicked] = useState(['Позы']); // порядок = порядок выбора
  const toggle = (c) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  const start = () => navigation.navigate('SketchSession', { plan: buildPlan(picked, count, order), seconds });

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
          {picked.length > 1 && order === 'sequence' && (
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
  const { plan, seconds } = route.params;
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(seconds);

  const finish = () => navigation.replace('SketchFinish', { count: i + 1, seconds });
  const next = () => {
    if (i + 1 >= plan.length) return navigation.replace('SketchFinish', { count: plan.length, seconds });
    setI(i + 1);
    setLeft(seconds);
  };

  useEffect(() => {
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (left <= 0) next();
  }, [left]);

  return (
    <Screen>
      <View style={s.timerWrap}>
        <View style={s.timer}><Text style={s.timerText}>{fmt(Math.max(left, 0))}</Text></View>
        <View style={s.progress}><View style={[s.progressFill, { width: `${(left / seconds) * 100}%` }]} /></View>
        <Text style={s.hint}>Кадр {i + 1} из {plan.length} · {plan[i]}</Text>
      </View>
      <Placeholder text={`Фото референс: ${plan[i]}`} style={{ flex: 1, marginTop: 12 }} />
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <Button title="Завершить" style={{ flex: 1 }} onPress={finish} />
        <Button title="Далее" icon="arrow-forward" variant="primary" style={{ flex: 1 }} onPress={next} />
      </View>
    </Screen>
  );
}

export function SketchFinish({ navigation, route }) {
  const { colors } = useTheme();
  const { count = 0, seconds = 0 } = route.params ?? {};
  const mins = Math.max(1, Math.round((count * seconds) / 60));
  return (
    <Screen>
      <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
        <Text style={{ fontSize: 26, fontWeight: '800', color: colors.ink }}>Тренировка окончена</Text>
        <Text style={{ color: colors.muted, marginTop: 6 }}>{count} набросков · около {mins} мин</Text>
      </Card>
      <View style={{ flex: 1 }} />
      <View style={{ gap: 12 }}>
        <Button title="Прикрепить фото" icon="attach" />
        <Button title="Выйти к настройкам" variant="primary" onPress={() => navigation.popToTop()} />
      </View>
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
});
