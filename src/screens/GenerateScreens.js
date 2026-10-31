import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Card, Checkbox, Label } from '../components/ui';
import { useTheme, useStyles, radius } from '../theme';
import { useApp } from '../state';
import { api } from '../api';

export function GenerateSetup({ navigation }) {
  const { colors } = useTheme();
  const [v, setV] = useState({ topic: true, idea: true, palette: false });
  const [error, setError] = useState(false);
  const set = (k) => (val) => { setV((p) => ({ ...p, [k]: val })); setError(false); };

  const start = () => {
    if (!v.topic && !v.idea && !v.palette) return setError(true);
    navigation.navigate('GenerateResult', v);
  };

  return (
    <Screen>
      <Card style={{ paddingVertical: 8 }}>
        <Checkbox checked={v.topic} onChange={set('topic')} label="Случайная тема" />
        <Checkbox checked={v.idea} onChange={set('idea')} label="Случайная идея" />
        <Checkbox checked={v.palette} onChange={set('palette')} label="Случайная палитра" />
      </Card>
      {error && (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 14 }}>
          <Ionicons name="alert-circle" size={20} color={colors.accent} />
          <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '600', flex: 1 }}>
            Нельзя сгенерировать: выберите хотя бы один пункт
          </Text>
        </View>
      )}
      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <Button title="Начать" variant="primary" icon="sparkles" onPress={start} style={{ minWidth: 200 }} />
      </View>
    </Screen>
  );
}

export function GenerateResult({ navigation, route }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const { loggedIn } = useApp();
  const { topic = true, idea = true, palette = true, saved } = route.params ?? {};
  const [result, setResult] = useState(saved ?? null);   // { theme, idea, palette }
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);            // { text, error, needLogin }
  const [isSaved, setIsSaved] = useState(!!saved);

  const roll = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      // prev_* — чтобы «Пересоздать» не выдавал то же самое значение
      const r = await api.generate({ theme: topic, idea, palette }, result ?? {});
      setResult(r);
      setIsSaved(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => { if (!saved) roll(); }, []);

  const save = async () => {
    if (!loggedIn) return setStatus({ text: 'Нельзя сохранить, пока вы не вошли в профиль.', error: true, needLogin: true });
    try {
      await api.saveGeneration({
        title: (result.theme || result.idea || 'Генерация').slice(0, 100),
        theme: result.theme ?? '',
        idea: result.idea ?? '',
        palette: result.palette ?? [],
      });
      setIsSaved(true);
      setStatus({ text: 'Сохранено. Смотрите в «Сохранённых генерациях».', error: false });
    } catch (e) {
      setStatus({ text: e.message, error: true });
    }
  };

  if (error) {
    return (
      <Screen>
        <Card style={{ gap: 12 }}>
          <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 15 }}>{error}</Text>
          <Button title="Повторить" onPress={roll} />
        </Card>
        <Button title="Назад" onPress={() => navigation.goBack()} style={{ marginTop: 'auto' }} />
      </Screen>
    );
  }
  if (!result) return <Screen><Text style={{ color: colors.muted, textAlign: 'center', marginTop: 40 }}>Генерируем…</Text></Screen>;

  return (
    <Screen scroll>
      {result.theme ? <Card><Label>ТЕМА</Label><Text style={s.big}>{result.theme}</Text></Card> : null}
      {result.idea ? <Card><Label>ИДЕЯ</Label><Text style={s.big}>{result.idea}</Text></Card> : null}
      {result.palette ? (
        <Card>
          <Label>ПАЛИТРА</Label>
          <View style={s.palette}>
            {result.palette.map((c) => <View key={c} style={[s.swatch, { backgroundColor: c }]} />)}
          </View>
        </Card>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button title={isSaved ? 'Сохранено' : 'Сохранить'} icon={isSaved ? 'bookmark' : 'bookmark-outline'} style={{ flex: 1 }} disabled={isSaved} onPress={save} />
        {!saved && <Button title="Пересоздать" icon="refresh" variant="primary" style={{ flex: 1 }} disabled={busy} onPress={roll} />}
      </View>
      {status ? (
        <View style={{ gap: 10, alignItems: 'flex-start' }}>
          <Text style={{ color: status.error ? colors.accent : colors.muted, fontSize: 15, fontWeight: '600' }}>{status.text}</Text>
          {status.needLogin ? <Button title="Войти в аккаунт" variant="primary" style={{ paddingVertical: 9, paddingHorizontal: 14 }} onPress={() => navigation.navigate('Profile', { screen: 'Login' })} /> : null}
        </View>
      ) : null}
      <Button title="Назад" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

const makeStyles = (c) => StyleSheet.create({
  big: { fontSize: 20, fontWeight: '700', color: c.ink },
  palette: { flexDirection: 'row', gap: 8, height: 90 },
  swatch: { flex: 1, borderRadius: radius.m },
});
