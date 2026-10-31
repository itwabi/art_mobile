import React, { useRef, useState } from 'react';
import { View, Text, Image, FlatList, Pressable, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useStyles, radius } from '../theme';

// Горизонтальная лента фото со свайпом, стрелками и счётчиком.
// Размер берётся у контейнера, поэтому height можно задавать числом или '100%'.
export function PhotoPager({ images, height, fit = 'contain', startIndex = 0, onPress, dots = false, dark = false }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [index, setIndex] = useState(startIndex);
  const listRef = useRef(null);
  const many = images.length > 1;

  const go = (i) => {
    const n = Math.max(0, Math.min(images.length - 1, i));
    listRef.current?.scrollToOffset({ offset: n * box.w, animated: true });
    setIndex(n);
  };
  const onScroll = (e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (box.w || 1));
    if (i !== index && i >= 0 && i < images.length) setIndex(i);
  };

  return (
    <View>
      <View
        style={[s.frame, { height }, dark && { backgroundColor: '#000', borderRadius: 0, borderWidth: 0 }]}
        onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {box.w > 0 && (
          <FlatList
            ref={listRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            initialScrollIndex={Math.min(startIndex, images.length - 1)}
            getItemLayout={(_, i) => ({ length: box.w, offset: box.w * i, index: i })}
            onScroll={onScroll}
            scrollEventThrottle={16}
            renderItem={({ item, index: i }) => (
              <Pressable disabled={!onPress} onPress={() => onPress?.(i)} style={{ width: box.w, height: box.h }}>
                <Image source={{ uri: item }} style={{ width: box.w, height: box.h }} resizeMode={fit} />
              </Pressable>
            )}
          />
        )}
        {many && (
          <>
            <Pressable accessibilityLabel="Предыдущее фото" disabled={index === 0} onPress={() => go(index - 1)} style={[s.arrow, { left: 8 }, index === 0 && { opacity: 0.3 }]}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
            <Pressable accessibilityLabel="Следующее фото" disabled={index === images.length - 1} onPress={() => go(index + 1)} style={[s.arrow, { right: 8 }, index === images.length - 1 && { opacity: 0.3 }]}>
              <Ionicons name="chevron-forward" size={22} color="#fff" />
            </Pressable>
            <View style={s.count}><Text style={s.countText}>{index + 1} / {images.length}</Text></View>
          </>
        )}
      </View>
      {many && dots && (
        <View style={s.dots}>
          {images.map((_, i) => <View key={i} style={[s.dot, i === index && { backgroundColor: colors.accent }]} />)}
        </View>
      )}
    </View>
  );
}

// Просмотр фото на весь экран (как увеличение в вебе)
export function PhotoViewer({ images, index = 0, visible, onClose }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {images.length > 0 && <PhotoPager images={images} height="100%" startIndex={index} dark />}
        <Pressable
          accessibilityLabel="Закрыть"
          onPress={onClose}
          style={{ position: 'absolute', top: insets.top + 10, right: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const makeStyles = (c) => StyleSheet.create({
  frame: { width: '100%', backgroundColor: c.placeholder, borderRadius: radius.m, overflow: 'hidden', borderWidth: 1, borderColor: c.border },
  arrow: { position: 'absolute', top: '50%', marginTop: -20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  count: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.border },
});
