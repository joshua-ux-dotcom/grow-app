import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

export function clampLightboxIndex(index, count) {
  if (!Number.isInteger(index) || count <= 0) return 0;
  return Math.min(Math.max(index, 0), count - 1);
}

export function getLightboxOffset(index, width, count) {
  return clampLightboxIndex(index, count) * Math.max(0, Number(width) || 0);
}

export function getLightboxIndexFromOffset(offset, width, count) {
  if (!(width > 0)) return 0;
  return clampLightboxIndex(Math.round((Number(offset) || 0) / width), count);
}

export default function ImageLightboxModal({
  visible,
  imageUrls = [],
  initialIndex = 0,
  onClose,
}) {
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const canShow = visible && imageUrls.length > 0;

  useEffect(() => {
    if (!canShow) return;
    setActiveIndex(clampLightboxIndex(initialIndex, imageUrls.length));
  }, [canShow, imageUrls.length, initialIndex]);

  useEffect(() => {
    if (!canShow) return;
    scrollRef.current?.scrollTo({
      x: getLightboxOffset(activeIndex, width, imageUrls.length),
      animated: false,
    });
  }, [activeIndex, canShow, imageUrls.length, width]);

  return (
    <Modal
      visible={canShow}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) =>
            setActiveIndex(
              getLightboxIndexFromOffset(
                event.nativeEvent.contentOffset.x,
                width,
                imageUrls.length,
              ),
            )
          }
        >
          {imageUrls.map((uri, index) => (
            <View key={`${uri}-${index}`} style={{ width, height }}>
              <Image
                source={{ uri }}
                style={styles.image}
                resizeMode="contain"
                accessibilityLabel={`Feedback-Bild ${index + 1} von ${imageUrls.length}`}
              />
            </View>
          ))}
        </ScrollView>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bildansicht schließen"
          onPress={onClose}
          style={styles.close}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.96)" },
  image: { width: "100%", height: "100%" },
  close: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(40,40,40,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "#fff", fontSize: 32, lineHeight: 35 },
});
