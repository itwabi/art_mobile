import * as ImagePicker from 'expo-image-picker';

export async function pickPhotos({ multiple = true } = {}) {
  try {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: multiple,
      selectionLimit: multiple ? 20 : 1,
      quality: 0.8,
    });
    if (res.canceled) return [];
    return res.assets.map((a) => a.uri);
  } catch (e) {
    return [];
  }
}
