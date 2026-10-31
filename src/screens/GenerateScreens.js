import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Card, Checkbox, Label } from '../components/ui';
import { useTheme, useStyles, radius } from '../theme';
import { generated } from '../data/mock';

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
  const { topic = true, idea = true, palette = true } = route.params ?? {};
  return (
    <Screen scroll>
      {topic && <Card><Label>ТЕМА</Label><Text style={s.big}>{generated.topic}</Text></Card>}
      {idea && <Card><Label>ИДЕЯ</Label><Text style={s.big}>{generated.idea}</Text></Card>}
      {palette && (
        <Card>
          <Label>ПАЛИТРА</Label>
          <View style={s.palette}>
            {generated.palette.map((c) => <View key={c} style={[s.swatch, { backgroundColor: c }]} />)}
          </View>
        </Card>
      )}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button title="Сохранить" icon="bookmark-outline" style={{ flex: 1 }} />
        <Button title="Пересоздать" icon="refresh" variant="primary" style={{ flex: 1 }} />
      </View>
      <Button title="Назад" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

const makeStyles = (c) => StyleSheet.create({
  big: { fontSize: 20, fontWeight: '700', color: c.ink },
  palette: { flexDirection: 'row', gap: 8, height: 90 },
  swatch: { flex: 1, borderRadius: radius.m },
});
