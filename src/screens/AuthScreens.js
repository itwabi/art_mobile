import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Screen, Button, Card, Label } from '../components/ui';
import { useTheme, useStyles, radius } from '../theme';
import { useApp } from '../state';
import { api } from '../api';

// Общая форма «никнейм + пароль» для входа и регистрации
function AuthForm({ navigation, mode }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const { login, register } = useApp();
  const isRegister = mode === 'register';
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [rules, setRules] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // правила длины берём с сервера, чтобы не расходились с вебом
  useEffect(() => { if (isRegister) api.rules().then(setRules).catch(() => {}); }, [isRegister]);

  const submit = async () => {
    const nick = nickname.trim();
    if (!nick || !password) return setError('Введите никнейм и пароль');
    if (isRegister && rules) {
      if (nick.length < rules.nickname_min || nick.length > rules.nickname_max)
        return setError(`Никнейм должен быть от ${rules.nickname_min} до ${rules.nickname_max} символов`);
      if (password.length < rules.password_min || password.length > rules.password_max)
        return setError(`Пароль должен быть от ${rules.password_min} до ${rules.password_max} символов`);
    }
    setBusy(true);
    setError(null);
    try {
      await (isRegister ? register(nick, password) : login(nick, password));
      navigation.popToTop(); // вход выполнен — ProfileHome сам покажет меню профиля
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <Card style={{ gap: 14 }}>
        <View>
          <Label>Никнейм</Label>
          <TextInput
            value={nickname}
            onChangeText={(t) => { setNickname(t); setError(null); }}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Ваш никнейм"
            placeholderTextColor={colors.muted}
            style={s.input}
          />
        </View>
        <View>
          <Label>Пароль</Label>
          <TextInput
            value={password}
            onChangeText={(t) => { setPassword(t); setError(null); }}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Пароль"
            placeholderTextColor={colors.muted}
            onSubmitEditing={submit}
            style={s.input}
          />
        </View>
        {error ? <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '600' }}>{error}</Text> : null}
        <Button title={busy ? 'Подождите…' : isRegister ? 'Зарегистрироваться' : 'Войти'} variant="primary" disabled={busy} onPress={submit} />
      </Card>
      <Button
        title={isRegister ? 'У меня уже есть аккаунт' : 'Создать аккаунт'}
        onPress={() => navigation.replace(isRegister ? 'Login' : 'Register')}
      />
      <Button title="Назад" onPress={() => navigation.goBack()} style={{ marginTop: 'auto' }} />
    </Screen>
  );
}

export const Login = (props) => <AuthForm {...props} mode="login" />;
export const Register = (props) => <AuthForm {...props} mode="register" />;

const makeStyles = (c) => StyleSheet.create({
  input: {
    borderWidth: 1.5, borderColor: c.border, borderRadius: radius.s, paddingHorizontal: 12, paddingVertical: 12,
    fontSize: 16, color: c.ink, backgroundColor: c.card,
  },
});
