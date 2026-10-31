import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useStyles, radius, space } from '../theme';

export function Screen({ children, scroll = false, style }) {
  const s = useStyles(makeStyles);
  const Inner = scroll ? ScrollView : View;
  return (
    <View style={s.screen}>
      <Inner
        style={[s.inner, scroll ? { padding: 0 } : { flex: 1 }, style]}
        contentContainerStyle={scroll ? { padding: space.m, gap: space.m, flexGrow: 1 } : undefined}
      >
        {children}
      </Inner>
    </View>
  );
}

export function Button({ title, onPress, variant = 'secondary', icon, style, disabled }) {
  const { colors } = useTheme();
  const s = useStyles(makeStyles);
  const primary = variant === 'primary';
  const danger = variant === 'danger';
  const fg = primary ? '#fff' : danger ? colors.accent : colors.ink;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        s.btn,
        primary && { backgroundColor: colors.accent, borderColor: colors.accent },
        danger && { borderColor: colors.accent },
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.75 },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[s.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }) {
  const s = useStyles(makeStyles);
  return <View style={[s.card, style]}>{children}</View>;
}

export function Label({ children }) {
  const s = useStyles(makeStyles);
  return <Text style={s.label}>{children}</Text>;
}

export function Checkbox({ checked, onChange, label }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Pressable onPress={() => onChange?.(!checked)} style={s.checkRow}>
      <View style={[s.checkBox, checked && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
        {checked ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
      </View>
      <Text style={s.checkLabel}>{label}</Text>
    </Pressable>
  );
}

// Выпадающий список: работает одинаково на телефоне и в вебе (модальное окно со списком)
export function Select({ label, value, options, onChange, style }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={style}>
      <Label>{label}</Label>
      <Pressable style={s.select} onPress={() => setOpen(true)}>
        <Text style={s.selectText}>{current?.label}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <Text style={s.sheetTitle}>{label}</Text>
            <ScrollView>
              {options.map((o) => (
                <Pressable
                  key={String(o.value)}
                  onPress={() => { onChange(o.value); setOpen(false); }}
                  style={({ pressed }) => [s.option, pressed && { backgroundColor: colors.accentSoft }]}
                >
                  <Text style={[s.optionText, o.value === value && { color: colors.accent, fontWeight: '800' }]}>{o.label}</Text>
                  {o.value === value ? <Ionicons name="checkmark" size={20} color={colors.accent} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// Окно подтверждения (Alert.alert в вебе не работает, поэтому свой вариант)
export function ConfirmModal({ visible, title, text, confirmLabel = 'Удалить', onConfirm, onCancel }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={s.backdrop} onPress={onCancel}>
        <Pressable style={[s.sheet, { padding: 20, gap: 14 }]} onPress={() => {}}>
          <Text style={{ fontSize: 19, fontWeight: '800', color: colors.ink }}>{title}</Text>
          {text ? <Text style={{ fontSize: 15, color: colors.muted, lineHeight: 21 }}>{text}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button title="Отмена" style={{ flex: 1 }} onPress={onCancel} />
            <Button title={confirmLabel} variant="danger" style={{ flex: 1 }} onPress={onConfirm} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ListRow({ title, right, onPress, icon }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.row, pressed && { opacity: 0.75 }]}>
      {icon ? <Ionicons name={icon} size={20} color={colors.accent} style={{ marginRight: 12 }} /> : null}
      <Text style={[s.rowTitle, { flex: 1 }]}>{title}</Text>
      {right ?? <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
    </Pressable>
  );
}

export function Placeholder({ text, style, icon = 'image-outline' }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <View style={[s.placeholder, style]}>
      <Ionicons name={icon} size={36} color={colors.muted} />
      <Text style={{ color: colors.muted, marginTop: 6, fontSize: 15 }}>{text}</Text>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  inner: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: space.m },
  btn: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, paddingHorizontal: 22, borderRadius: radius.m,
    borderWidth: 1.5, borderColor: c.ink, backgroundColor: c.card,
  },
  btnText: { fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: c.card, borderRadius: radius.l, borderWidth: 1, borderColor: c.border, padding: space.m },
  label: { fontSize: 13, color: c.muted, marginBottom: 6, fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  checkBox: { width: 30, height: 30, borderRadius: 8, borderWidth: 2, borderColor: c.ink, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card },
  checkLabel: { flex: 1, fontSize: 17, color: c.ink, fontWeight: '500' },
  select: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: c.border, borderRadius: radius.s, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: c.card,
  },
  selectText: { fontSize: 16, color: c.ink },
  backdrop: { flex: 1, backgroundColor: c.overlay, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 420, maxHeight: '80%', backgroundColor: c.card, borderRadius: radius.l, padding: 8, borderWidth: 1, borderColor: c.border },
  sheetTitle: { fontSize: 14, fontWeight: '700', color: c.muted, padding: 12, paddingBottom: 6 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 12, borderRadius: radius.s },
  optionText: { fontSize: 17, color: c.ink },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: c.card,
    borderWidth: 1, borderColor: c.border, borderRadius: radius.m, padding: 16,
  },
  rowTitle: { fontSize: 17, fontWeight: '600', color: c.ink },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: c.placeholder, borderRadius: radius.m, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.border },
});
