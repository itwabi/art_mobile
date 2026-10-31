import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, Pressable, Switch, StyleSheet, Platform, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Card, ListRow, ConfirmModal } from '../components/ui';
import { PhotoPager, PhotoViewer } from '../components/photos';
import { useTheme, useStyles, radius } from '../theme';
import { useApp } from '../state';
import { api } from '../api';

const isWeb = Platform.OS === 'web';
const BackBtn = ({ navigation }) => <Button title="Назад" onPress={() => navigation.goBack()} style={{ marginTop: 'auto' }} />;

// Первый экран вкладки: гость или меню профиля в зависимости от входа
export function ProfileHome(props) {
  const { loggedIn } = useApp();
  return loggedIn ? <ProfileMenu {...props} /> : <ProfileGuest {...props} />;
}

function ProfileGuest({ navigation }) {
  const { colors } = useTheme();
  return (
    <Screen>
      <Card style={{ alignItems: 'center', paddingVertical: 36, marginTop: 40 }}>
        <Ionicons name="person-circle-outline" size={64} color={colors.muted} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 8 }}>Вы еще не вошли в профиль</Text>
      </Card>
      <View style={{ gap: 12, marginTop: 20 }}>
        <Button title="Войти в аккаунт" variant="primary" onPress={() => navigation.navigate('Login')} />
        <Button title="Зарегистрироваться" onPress={() => navigation.navigate('Register')} />
      </View>
    </Screen>
  );
}

function ProfileMenu({ navigation }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const { logout, user } = useApp();
  return (
    <Screen>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={s.avatar}><Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{(user?.nickname || '?')[0].toUpperCase()}</Text></View>
        <View><Text style={{ fontSize: 20, fontWeight: '800', color: colors.ink }}>{user?.nickname}</Text><Text style={{ color: colors.muted }}>Серия: {user?.streak_days ?? 0} дн.</Text></View>
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
  const [mine, setMine] = useState(null);
  const [error, setError] = useState(null);
  useFocusEffect(useCallback(() => {
    api.myChallenges().then((l) => { setMine(l); setError(null); }).catch((e) => setError(e.message));
  }, [joined]));
  if (error) return <Screen><Card><Text style={{ color: colors.accent, fontWeight: '600' }}>{error}</Text></Card><BackBtn navigation={navigation} /></Screen>;
  if (!mine) return <Screen><Text style={{ color: colors.muted, textAlign: 'center', marginTop: 40 }}>Загрузка…</Text></Screen>;
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
  const { colors } = useTheme();
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  useFocusEffect(useCallback(() => {
    api.generations().then((l) => { setList(l); setError(null); }).catch((e) => setError(e.message));
  }, []));
  if (error) return <Screen><Card><Text style={{ color: colors.accent, fontWeight: '600' }}>{error}</Text></Card><BackBtn navigation={navigation} /></Screen>;
  if (!list) return <Screen><Text style={{ color: colors.muted, textAlign: 'center', marginTop: 40 }}>Загрузка…</Text></Screen>;
  return (
    <Screen>
      <View style={{ gap: 10 }}>
        {list.length === 0 && (
          <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink, textAlign: 'center' }}>Сохранённых генераций пока нет</Text>
          </Card>
        )}
        {list.map((g) => (
          <Card key={g.id} style={s.listCard}>
            <Text style={s.cardTitle}>{g.title}</Text>
            <Button title="подробно" style={s.small} onPress={() => navigation.navigate('Generate', { screen: 'GenerateResult', params: { saved: g, topic: true, idea: true, palette: true } })} />
          </Card>
        ))}
      </View>
      <BackBtn navigation={navigation} />
    </Screen>
  );
}

const MAX_TAGS = 2;

function TagChips({ tags }) {
  const s = useStyles(makeStyles);
  const shown = tags.slice(0, MAX_TAGS);
  return (
    <View style={s.tags}>
      {shown.map((t) => <View key={t} style={s.tag}><Text numberOfLines={1} style={s.tagText}>{t}</Text></View>)}
      {tags.length > MAX_TAGS ? <View style={s.tag}><Text style={s.tagText}>+{tags.length - MAX_TAGS}</Text></View> : null}
    </View>
  );
}

export function MyWorks({ navigation }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { works, removeWorks, refreshWorks } = useApp();
  const [edit, setEdit] = useState(false);
  const [error, setError] = useState(null);
  useFocusEffect(useCallback(() => { refreshWorks().catch(() => {}); }, []));
  const [sel, setSel] = useState([]);
  const [confirm, setConfirm] = useState(false);
  const toggle = (id) => setSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  // Размер плитки считаем явно: aspectRatio внутри flexWrap на телефоне схлопывался в тонкие полосы
  const gap = 10;
  const size = Math.floor((Math.min(width, 640) - 32 - gap * 2) / 3);

  const doDelete = async () => {
    setConfirm(false);
    try {
      await removeWorks(sel);
      setError(null);
    } catch (e) {
      setError(e.message);
      refreshWorks().catch(() => {});
    }
    setSel([]);
    setEdit(false);
  };

  return (
    <Screen scroll>
      {works.length > 0 && (
        <View style={{ alignItems: 'flex-end' }}>
          <Button title={edit ? 'Готово' : 'Редактировать'} icon={edit ? 'checkmark' : 'create-outline'} style={s.small} onPress={() => { setEdit(!edit); setSel([]); }} />
        </View>
      )}
      {error ? <Text style={{ color: colors.accent, fontWeight: '600' }}>{error}</Text> : null}
      {works.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink, textAlign: 'center' }}>Работ пока нет</Text>
          <Text style={{ color: colors.muted, marginTop: 6, textAlign: 'center' }}>Прикрепите фото после тренировки или к теме челленджа</Text>
        </Card>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
          {works.map((w) => {
            const on = sel.includes(w.id);
            return (
              <Pressable
                key={w.id}
                onPress={() => (edit ? toggle(w.id) : navigation.navigate('MyWork', { id: w.id }))}
                style={{ width: size, height: size, borderRadius: radius.s, overflow: 'hidden', backgroundColor: colors.placeholder, borderWidth: on ? 4 : 0, borderColor: colors.accent }}
              >
                <Image source={{ uri: w.images[0].uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                {w.images.length > 1 ? (
                  <View style={s.count}>
                    <Ionicons name="copy-outline" size={11} color="#fff" />
                    <Text style={s.countText}>{w.images.length}</Text>
                  </View>
                ) : null}
                <TagChips tags={w.tags} />
                {edit ? <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={26} color="#fff" style={{ position: 'absolute', top: 6, right: 6 }} /> : null}
              </Pressable>
            );
          })}
        </View>
      )}
      {edit && sel.length > 0 ? <Button title={`Удалить выбранные (${sel.length})`} variant="danger" onPress={() => setConfirm(true)} /> : null}
      <BackBtn navigation={navigation} />
      <ConfirmModal
        visible={confirm}
        title={`Удалить выбранные работы (${sel.length})?`}
        text="Это нельзя отменить."
        onConfirm={doDelete}
        onCancel={() => setConfirm(false)}
      />
    </Screen>
  );
}

// Одна работа: просмотр фото альбома, теги, дата и удаление
export function MyWork({ navigation, route }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const { works, removeWorks } = useApp();
  const item = works.find((w) => w.id === route.params?.id);
  const [viewer, setViewer] = useState(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!item) navigation.goBack();
    else navigation.setOptions({ title: item.title });
  }, [item]);

  if (!item) return null;
  const uris = item.images.map((im) => im.uri);
  const many = uris.length > 1;

  return (
    <Screen scroll>
      <PhotoPager images={uris} height={360} dots onPress={(i) => setViewer(i)} />
      <Card style={{ gap: 10 }}>
        <View style={s.tagsRow}>
          {item.tags.map((t) => <View key={t} style={s.tagSolid}><Text style={s.tagSolidText}>{t}</Text></View>)}
        </View>
        <Text style={{ color: colors.muted }}>{item.date}{many ? ` · ${uris.length} фото` : ''}</Text>
      </Card>
      <View style={{ gap: 12, marginTop: 'auto' }}>
        <Button title="Удалить" variant="danger" onPress={() => setConfirm(true)} />
        <Button title="Назад" onPress={() => navigation.goBack()} />
      </View>
      <PhotoViewer visible={viewer !== null} images={uris} index={viewer ?? 0} onClose={() => setViewer(null)} />
      <ConfirmModal
        visible={confirm}
        title={many ? `Удалить альбом (${uris.length} фото)?` : 'Удалить эту работу?'}
        text="Это нельзя отменить."
        onConfirm={async () => { setConfirm(false); try { await removeWorks([item.id]); } catch {} }}
        onCancel={() => setConfirm(false)}
      />
    </Screen>
  );
}

const makeStyles = (c) => StyleSheet.create({
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  listCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingLeft: 18, borderRadius: radius.m },
  cardTitle: { fontSize: 17, fontWeight: '700', color: c.ink, flex: 1 },
  small: { paddingVertical: 9, paddingHorizontal: 14 },
  count: { position: 'absolute', top: 5, left: 5, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  countText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  tags: { position: 'absolute', left: 4, right: 4, bottom: 4, gap: 3, alignItems: 'flex-start' },
  tag: { maxWidth: '100%', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  tagText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagSolid: { backgroundColor: c.accentSoft, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  tagSolidText: { color: c.accent, fontSize: 14, fontWeight: '700' },
});
