import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { COLORS } from "../../../constants/colors";
import { s, sv, sf } from "../../../constants/layout";

export default function AdminFeedbackCard({ feedback, onDelete, onOpenImage }) {
  const createdAt = formatDate(feedback.createdAt);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{feedback.type}</Text>
        </View>

        <Text style={styles.dateText}>{createdAt}</Text>
      </View>

      <Text style={styles.message}>
        {feedback.message || "Keine Nachricht vorhanden."}
      </Text>

      {feedback.imageUrls?.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.images}
        >
          {feedback.imageUrls.map((uri, index) => (
            <Pressable
              key={`${uri}-${index}`}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Feedback-Bild ${index + 1} öffnen`}
              onPress={() => onOpenImage?.(feedback.imageUrls, index)}
            >
              <Image source={{ uri }} style={styles.image} resizeMode="cover" />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Feather name="user" size={s(14)} color={COLORS.mutedGold} />
          <Text style={styles.metaText}>{feedback.username}</Text>
        </View>

        {feedback.importance !== null && feedback.importance !== undefined && (
          <View style={styles.metaItem}>
            <Feather
              name="alert-circle"
              size={s(14)}
              color={COLORS.mutedGold}
            />
            <Text style={styles.metaText}>
              Wichtigkeit: {feedback.importance}
            </Text>
          </View>
        )}
      </View>

      {onDelete && (
        <Pressable
          style={styles.deleteButton}
          onPress={() => onDelete(feedback)}
        >
          <Feather name="trash-2" size={s(15)} color="#ff6b6b" />
          <Text style={styles.deleteText}>Feedback löschen</Text>
        </Pressable>
      )}
    </View>
  );
}

function formatDate(value) {
  if (!value) return "Kein Datum";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Kein Datum";
  }

  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

const styles = StyleSheet.create({
  card: {
    borderRadius: s(18),
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: s(16),
    marginBottom: sv(14),
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: sv(12),
    gap: s(12),
  },
  typeBadge: {
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    paddingHorizontal: s(10),
    paddingVertical: sv(5),
    borderRadius: s(999),
  },
  typeText: {
    color: COLORS.softGold,
    fontSize: sf(12),
    fontWeight: "800",
  },
  dateText: {
    color: COLORS.textSecondary,
    fontSize: sf(12),
    fontWeight: "700",
  },
  message: {
    color: COLORS.white,
    fontSize: sf(15),
    lineHeight: sf(22),
    marginBottom: sv(14),
  },
  image: {
    width: s(120),
    height: s(120),
    borderRadius: s(14),
    marginRight: s(10),
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  images: { marginBottom: sv(14) },
  metaRow: {
    gap: sv(7),
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(7),
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: sf(13),
    fontWeight: "600",
  },
  deleteButton: {
    marginTop: sv(14),
    paddingTop: sv(12),
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
  },
  deleteText: {
    color: "#ff6b6b",
    fontSize: sf(13),
    fontWeight: "800",
  },
});
