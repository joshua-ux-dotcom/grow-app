import React from "react";
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { COLORS } from "../../../constants/colors";
import { s, sv, sf } from "../../../constants/layout";

const uploadFieldImage = require("../../../assets/feedback/feedback-upload-field.webp");

export default function FeedbackImageUploadCard({
  selectedImages,
  onPickImage,
  onRemoveImage,
  onOpenImage,
}) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        activeOpacity={0.86}
        onPress={onPickImage}
        style={styles.uploadPressable}
      >
        <ImageBackground
          source={uploadFieldImage}
          style={styles.uploadBackground}
          imageStyle={styles.uploadImage}
          resizeMode="stretch"
        >
          <View style={styles.textLayer} pointerEvents="none">
            <Text style={styles.uploadTitle}>
              {selectedImages.length
                ? "Weitere Bilder hinzufügen"
                : "Bilder hinzufügen"}
            </Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>

      {selectedImages.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.previewRow}
        >
          {selectedImages.map((image, index) => (
            <View key={image.assetId || image.uri} style={styles.thumbnailWrap}>
              <TouchableOpacity
                accessibilityRole="imagebutton"
                accessibilityLabel={`Bild ${index + 1} öffnen`}
                onPress={() => onOpenImage(index)}
              >
                <Image
                  source={{ uri: image.uri }}
                  style={styles.previewImage}
                />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Bild ${index + 1} entfernen`}
                onPress={() => onRemoveImage(index)}
                style={styles.removeButton}
              >
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: -s(2),
    marginBottom: sv(30),
  },
  uploadPressable: {
    width: "100%",
    height: sv(118),
    overflow: "visible",
  },
  uploadBackground: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: sv(16),
    paddingHorizontal: s(20),
    overflow: "hidden",
  },
  uploadImage: {
    borderRadius: s(18),
  },
  textLayer: {
    alignItems: "center",
    transform: [{ translateY: sv(-10) }],
  },
  uploadTitle: {
    color: COLORS.lightGold,
    fontSize: sf(13),
    lineHeight: sv(17),
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(212,175,55,0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  uploadSubtext: {
    color: COLORS.textDim,
    fontSize: sf(11),
    lineHeight: sv(14),
    fontWeight: "500",
    textAlign: "center",
    marginTop: sv(2),
  },
  previewRow: {
    marginTop: sv(12),
  },
  thumbnailWrap: { marginRight: s(10), position: "relative" },
  previewImage: {
    width: s(82),
    height: s(82),
    borderRadius: s(12),
  },
  previewFooter: {
    minHeight: sv(42),
    paddingHorizontal: s(14),
    paddingVertical: sv(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewText: {
    color: COLORS.textDim,
    fontSize: sf(12),
    fontWeight: "600",
  },
  removeButton: {
    position: "absolute",
    top: -s(5),
    right: -s(5),
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: {
    color: COLORS.lightGold,
    fontSize: sf(18),
    fontWeight: "700",
  },
});
