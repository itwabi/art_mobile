import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// ---------- Адрес бэкенда ----------
// 1) EXPO_PUBLIC_API_URL (например http://192.168.1.50:8000) — главный способ, задаётся в .env
// 2) иначе берём IP компьютера, на котором запущен `expo start` (работает на телефоне в одной Wi-Fi сети)
// 3) иначе: Android-эмулятор -> 10.0.2.2, всё остальное -> localhost
function resolveHost() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  const ip = hostUri ? hostUri.split(':')[0] : null;
  if (ip && !ip.includes('exp.direct') && !ip.includes('ngrok')) return `http://${ip}:8000`;
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  return 'http://localhost:8000';
}

export const HOST = resolveHost();
const BASE = `${HOST}/api`;

// Бэкенд отдаёт пути вида /media/works/1/abc.jpg — превращаем в полный адрес
export const mediaUrl = (path) => (!path ? null : /^https?:/i.test(path) ? path : HOST + path);

// ---------- Токен ----------
const TOKEN_KEY = 'art_token';
let token = null;
let onUnauthorized = () => {};

export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

const store = {
  get: async () => {
    try {
      return Platform.OS === 'web' ? window.localStorage.getItem(TOKEN_KEY) : await SecureStore.getItemAsync(TOKEN_KEY);
    } catch { return null; }
  },
  set: async (v) => {
    try {
      if (Platform.OS === 'web') window.localStorage.setItem(TOKEN_KEY, v);
      else await SecureStore.setItemAsync(TOKEN_KEY, v);
    } catch {}
  },
  clear: async () => {
    try {
      if (Platform.OS === 'web') window.localStorage.removeItem(TOKEN_KEY);
      else await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {}
  },
};

export async function loadToken() { token = await store.get(); return token; }
export async function saveToken(t) { token = t; await store.set(t); }
export async function clearToken() { token = null; await store.clear(); }
export const hasToken = () => !!token;

// ---------- Запросы ----------
// Загрузка файлов: XMLHttpRequest надёжнее fetch для FormData с файлами с телефона ({uri,name,type})
function xhrUpload(path, form) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', BASE + path);
    xhr.setRequestHeader('Accept', 'application/json');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 120000;
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch {}
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
    };
    xhr.onerror = () => reject(new Error(`Не удалось отправить фото на сервер (${HOST}). Проверьте соединение и размер файла`));
    xhr.ontimeout = () => reject(new Error('Сервер слишком долго отвечает. Попробуйте ещё раз'));
    xhr.send(form);
  });
}

async function request(method, path, body) {
  let status, ok, data;

  if (body instanceof FormData) {
    ({ ok, status, data } = await xhrUpload(path, body));
  } else {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const options = { method, headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    let res;
    try {
      res = await fetch(BASE + path, options);
    } catch {
      const err = new Error(`Нет связи с сервером (${HOST}). Проверьте, что бэкенд запущен`);
      err.network = true;
      throw err;
    }
    ok = res.ok;
    status = res.status;
    data = status === 204 ? null : await res.json().catch(() => ({}));
  }

  if (ok) return data;
  // FastAPI при ошибке валидации отдаёт detail списком — берём только строку
  const err = new Error(typeof data?.detail === 'string' ? data.detail : `Ошибка запроса (${status})`);
  err.status = status;
  if (status === 401 && token && !path.startsWith('/auth/')) onUnauthorized();
  throw err;
}

const get = (p) => request('GET', p);
const post = (p, b) => request('POST', p, b ?? {});
const del = (p) => request('DELETE', p);

// Файл для FormData: на телефоне это объект {uri,name,type}, в вебе нужен настоящий Blob
async function filePart(uri, index = 0) {
  const ext = (uri.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
  const type = safeExt === 'jpg' ? 'image/jpeg' : `image/${safeExt}`;
  const name = `photo_${Date.now()}_${index}.${safeExt}`;
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    return [blob, name];
  }
  return [{ uri, name, type }, undefined];
}

const appendFile = async (form, field, uri, i) => {
  const [part, name] = await filePart(uri, i);
  if (name) form.append(field, part, name); else form.append(field, part);
};

// Бэкенд отдаёт images: [{id, url}], приложение работает с {id, uri}
const mapItem = (it) => ({ ...it, images: it.images.map((im) => ({ id: im.id, uri: mediaUrl(im.url) })) });

export const api = {
  // auth
  rules: () => get('/auth/rules'),
  login: (nickname, password) => post('/auth/login', { nickname, password }),
  register: (nickname, password) => post('/auth/register', { nickname, password }),
  logout: () => post('/auth/logout'),

  // профиль
  me: () => get('/me'),

  // челленджи
  challenges: (kind) => get(`/challenges${kind ? `?kind=${kind}` : ''}`),
  challenge: (id) => get(`/challenges/${encodeURIComponent(id)}`),
  myChallenges: () => get('/me/challenges'),
  join: (id) => post(`/me/challenges/${encodeURIComponent(id)}`),
  leave: (id) => del(`/me/challenges/${encodeURIComponent(id)}`),

  // фото к темам челленджа
  challengeWorks: async (challengeId) => {
    const list = await get(`/me/works?challenge_id=${encodeURIComponent(challengeId)}`);
    return list.map((w) => ({ ...w, uri: mediaUrl(w.url) }));
  },
  uploadChallengeWork: async (uri, challengeId, topicId) => {
    const form = new FormData();
    await appendFile(form, 'file', uri);
    form.append('challenge_id', challengeId);
    form.append('topic_id', String(topicId));
    const w = await request('POST', '/me/works', form);
    return { ...w, uri: mediaUrl(w.url) };
  },

  // галерея («Ваши работы»)
  gallery: async () => (await get('/me/gallery')).map(mapItem),
  uploadAlbum: async (uris, categories) => {
    const form = new FormData();
    for (let i = 0; i < uris.length; i++) await appendFile(form, 'files', uris[i], i);
    if (categories?.length) form.append('categories', categories.join(','));
    return mapItem(await request('POST', '/me/gallery', form));
  },
  deleteGalleryItem: (id) => del(`/me/gallery/${id}`),

  // наброски
  sketchCategories: () => get('/sketch/categories'),
  sketchOptions: () => get('/sketch/options'),
  sketchReferences: async (names) => {
    const data = await get(`/sketch/references?categories=${encodeURIComponent(names.join(','))}`);
    const out = {};
    Object.keys(data).forEach((k) => { out[k] = data[k].map(mediaUrl); });
    return out;
  },

  // генерация
  generate: ({ theme, idea, palette }, prev = {}) => {
    const q = [`theme=${theme}`, `idea=${idea}`, `palette=${palette}`];
    if (prev.theme) q.push(`prev_theme=${encodeURIComponent(prev.theme)}`);
    if (prev.idea) q.push(`prev_idea=${encodeURIComponent(prev.idea)}`);
    if (prev.palette) q.push(`prev_palette=${encodeURIComponent(prev.palette.join(','))}`);
    return get(`/generate?${q.join('&')}`);
  },
  generations: () => get('/me/generations'),
  saveGeneration: (g) => post('/me/generations', g),
};
