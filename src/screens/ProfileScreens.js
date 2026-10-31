import React, { useState } from 'react';
import { View, Text, Pressable, Switch, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Card, ListRow } from '../components/ui';
import { useTheme, useStyles, radius } from '../theme';
import { useApp } from '../state';
import { allChallenges, savedGenerations, workColors } from '../data/mock';

const isWeb = Platform.OS === 'web';
const BackBtn = ({ navigation }) => <Button title="Назад" onPress={() => navigation.goBack()} style={{ marginTop: 'auto' }} />;

// Первый экран вкладки: гость или меню профиля в зависимости от входа
export function ProfileHome(props) {
  const { loggedIn } = useApp();
  return loggedIn ? <ProfileMenu {...props} /> : <ProfileGuest {...props} />;
}

function ProfileGuest() {
  const { colors } = useTheme();
  const { login } = useApp();
  return (
    <Screen>
      <Card style={{ alignItems: 'center', paddingVertical: 36, marginTop: 40 }}>
        <Ionicons name="person-circle-outline" size={64} color={colors.muted} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 8 }}>Вы еще не вошли в профиль</Text>
      </Card>
      <View style={{ gap: 12, marginTop: 20 }}>
        <Button title="Войти в аккаунт" variant="primary" onPress={login} />
        <Button title="Зарегистрироваться" onPress={login} />
      </View>
    </Screen>
  );
}

function ProfileMenu({ navigation }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const { logout } = useApp();
  return (
    <Screen>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={s.avatar}><Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>Н</Text></View>
        <View><Text style={{ fontSize: 20, fontWeight: '800', color: colors.ink }}>Никнейм</Text><Text style={{ color: colors.muted }}>Серия: 5 дней</Text></View>
      </Card>
      <View style={{ gap: 10, marginTop: 8 }}>
        {/* В вебе настройки приложения не нужны: тема переключается значком в углу, смена аккаунта — здесь */}
        {!isWeb && <ListRow icon="settings-outline" title="Настройки приложения" onPress={() => navigation.navigate('AppSettings')} />}
        <ListRow icon="trophy-outline" title="Ваши челленджи" onPress={() => navigation.navigate('MyChallenges')} />
        <ListRow icon="bookmark-outline" title="Сохраненные генерации" onPress={() => navigation.navigate('SavedGenerations')} />
        <ListRow icon="images-outline" title="Ваши работы" onPress={() => navigation.navigate('MyWorks')} />
        {isWeb && <ListRow icon="log-out-outline" title="Сменить аккаунт" onPress={logout} right={<View />} />}
      </View>
    </Screen>
  );
}

export function AppSettings({ navigation }) {
  const { colors, mode, toggle } = useTheme();
  const { logout } = useApp();
  return (
    <Screen>
      <View style={{ gap: 10 }}>
        <ListRow title="Тема приложения" right={<Switch value={mode === 'dark'} onValueChange={toggle} trackColor={{ true: colors.accent }} />} />
        <ListRow title="Смена аккаунта" onPress={() => { logout(); navigation.popToTop(); }} />
        <ListRow title="Смена пароля" />
      </View>
      <BackBtn navigation={navigation} />
    </Screen>
  );
}

export function MyChallenges({ navigation }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const { joined } = useApp();
  const mine = allChallenges.filter((c) => joined.includes(c.id));
  return (
    <Screen>
      <View style={{ gap: 10 }}>
        {mine.length === 0 && (
          <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink, textAlign: 'center' }}>Вы пока не участвуете ни в одном челлендже</Text>
            <Text style={{ color: colors.muted, marginTop: 6, textAlign: 'center' }}>Выберите челлендж в галерее и нажмите «Участвовать»</Text>
          </Card>
        )}
        {mine.map((c) => (
          <Card key={c.id} style={s.listCard}>
            <Text style={s.cardTitle}>{c.title}</Text>
            <Button title="подробно" style={s.small} onPress={() => navigation.navigate('Challenges', { screen: 'ChallengeDetail', params: { id: c.id } })} />
          </Card>
        ))}
      </View>
      <BackBtn navigation={navigation} />
    </Screen>
  );
}

export function SavedGenerations({ navigation }) {
  const s = useStyles(makeStyles);
  return (
    <Screen>
      <View style={{ gap: 10 }}>
        {savedGenerations.map((g) => (
          <Card key={g.id} style={s.listCard}>
            <Text style={s.cardTitle}>{g.title}</Text>
            <Button title="подробно" style={s.small} onPress={() => navigation.navigate('Generate', { screen: 'GenerateResult' })} />
          </Card>
        ))}
      </View>
      <BackBtn navigation={navigation} />
    </Screen>
  );
}

export function MyWorks({ navigation }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [edit, setEdit] = useState(false);
  const [sel, setSel] = useState([]);
  const toggle = (i) => setSel((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  // Размер плитки считаем явно: aspectRatio внутри flexWrap на телефоне схлопывался в тонкие полосы
  const gap = 10;
  const size = Math.floor((Math.min(width, 640) - 32 - gap * 2) / 3);
  return (
    <Screen scroll>
      <View style={{ alignItems: 'flex-end' }}>
        <Button title={edit ? 'Готово' : 'Редактировать'} icon={edit ? 'checkmark' : 'create-outline'} style={s.small} onPress={() => { setEdit(!edit); setSel([]); }} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
        {workColors.map((col, i) => {
          const on = sel.includes(i);
          return (
            <Pressable key={i} disabled={!edit} onPress={() => toggle(i)}
              style={{ width: size, height: size, borderRadius: radius.s, backgroundColor: col, borderWidth: on ? 4 : 0, borderColor: colors.accent }}>
              {edit ? <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={26} color="#fff" style={{ position: 'absolute', top: 6, right: 6 }} /> : null}
            </Pressable>
          );
        })}
      </View>
      {edit && sel.length > 0 ? <Button title={`Удалить (${sel.length})`} variant="danger" /> : null}
      <BackBtn navigation={navigation} />
    </Screen>
  );
}

const makeStyles = (c) => StyleSheet.create({
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  listCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingLeft: 18, borderRadius: radius.m },
  cardTitle: { fontSize: 17, fontWeight: '700', color: c.ink, flex: 1 },
  small: { paddingVertical: 9, paddingHorizontal: 14 },
});
