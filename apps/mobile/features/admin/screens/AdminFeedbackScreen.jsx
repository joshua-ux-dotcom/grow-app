import { logger } from "../../../lib/logger";
import { useCallback, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { COLORS } from "../../../constants/colors";
import { s, sv, sf } from "../../../constants/layout";
import {
  loadAdminFeedbackList,
  deleteAdminFeedback,
} from "../services/adminFeedback";

import AdminFeedbackCard from "../components/AdminFeedbackCard";
import AdminLoadingState from "../components/AdminLoadingState";
import AdminEmptyState from "../components/AdminEmptyState";
import ImageLightboxModal from "../../../components/ImageLightboxModal";

export default function AdminFeedbackScreen() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorText, setErrorText] = useState(null);
  const [lightbox, setLightbox] = useState({
    urls: [],
    index: 0,
    visible: false,
  });
  const loadRequestIdRef = useRef(0);
  const deletingFeedbackIdsRef = useRef(new Set());

  const loadFeedbacks = useCallback(async ({ refreshing = false } = {}) => {
    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;

    try {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorText(null);

      const list = await loadAdminFeedbackList(100);

      if (loadRequestIdRef.current !== requestId) return;

      setFeedbacks(list);
    } catch (error) {
      if (loadRequestIdRef.current !== requestId) return;

      logger.debug("Fehler beim Laden der Admin-Feedbacks:", error);

      if (String(error.message ?? "").includes("Not allowed")) {
        setErrorText("Kein Zugriff auf diese Feedback-Übersicht.");
      } else {
        setErrorText("Feedbacks konnten nicht geladen werden.");
      }
    } finally {
      if (loadRequestIdRef.current === requestId) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  const handleDeleteFeedback = useCallback((feedback) => {
    if (!feedback?.id || deletingFeedbackIdsRef.current.has(feedback.id))
      return;

    Alert.alert(
      "Feedback löschen?",
      "Dieses Feedback wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.",
      [
        {
          text: "Abbrechen",
          style: "cancel",
        },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            if (deletingFeedbackIdsRef.current.has(feedback.id)) return;

            deletingFeedbackIdsRef.current.add(feedback.id);

            try {
              await deleteAdminFeedback(feedback.id, feedback.imagePaths);

              setFeedbacks((prevFeedbacks) =>
                prevFeedbacks.filter((item) => item.id !== feedback.id),
              );
            } catch (error) {
              logger.debug("Fehler beim Löschen des Feedbacks:", error);

              Alert.alert("Fehler", "Feedback konnte nicht gelöscht werden.");
            } finally {
              deletingFeedbackIdsRef.current.delete(feedback.id);
            }
          },
        },
      ],
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeedbacks();

      return () => {
        loadRequestIdRef.current += 1;
      };
    }, [loadFeedbacks]),
  );

  if (isLoading) {
    return <AdminLoadingState text="Feedbacks werden geladen..." />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadFeedbacks({ refreshing: true })}
            tintColor={COLORS.softGold}
          />
        }
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={s(24)} color={COLORS.softGold} />
          </Pressable>

          <View style={styles.headerTextBox}>
            <Text style={styles.topLabel}>GROW INTERNAL</Text>
            <Text style={styles.title}>Feedbacks</Text>
            <Text style={styles.subtitle}>
              Alle eingegangenen Beta-Feedbacks der Nutzer.
            </Text>
          </View>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{feedbacks.length}</Text>
          <Text style={styles.summaryLabel}>geladene Feedbacks</Text>
        </View>

        {errorText && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorText}</Text>

            <Pressable onPress={() => loadFeedbacks()}>
              <Text style={styles.retryText}>Erneut laden</Text>
            </Pressable>
          </View>
        )}

        {!errorText && feedbacks.length === 0 && (
          <AdminEmptyState
            icon="inbox"
            title="Noch keine Feedbacks"
            text="Sobald Nutzer Feedback senden, erscheint es hier."
          />
        )}

        {!errorText &&
          feedbacks.map((feedback) => (
            <AdminFeedbackCard
              key={feedback.id}
              feedback={feedback}
              onDelete={handleDeleteFeedback}
              onOpenImage={(urls, index) =>
                setLightbox({ urls, index, visible: true })
              }
            />
          ))}
      </ScrollView>
      <ImageLightboxModal
        visible={lightbox.visible}
        imageUrls={lightbox.urls}
        initialIndex={lightbox.index}
        onClose={() => setLightbox((value) => ({ ...value, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: s(20),
    paddingTop: sv(56),
    paddingBottom: sv(34),
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: s(14),
    marginBottom: sv(22),
  },
  backButton: {
    width: s(42),
    height: s(42),
    borderRadius: s(21),
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextBox: {
    flex: 1,
  },
  topLabel: {
    color: COLORS.softGold,
    fontSize: sf(11),
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: sv(4),
  },
  title: {
    color: COLORS.white,
    fontSize: sf(28),
    fontWeight: "900",
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: sf(14),
    lineHeight: sf(20),
    marginTop: sv(6),
  },
  summaryBox: {
    borderRadius: s(20),
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: s(18),
    marginBottom: sv(18),
  },
  summaryValue: {
    color: COLORS.white,
    fontSize: sf(34),
    fontWeight: "900",
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: sf(14),
    fontWeight: "700",
    marginTop: sv(2),
  },
  errorBox: {
    borderRadius: s(16),
    backgroundColor: "rgba(255,80,80,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,80,80,0.25)",
    padding: s(14),
    marginBottom: sv(18),
  },
  errorText: {
    color: COLORS.white,
    fontSize: sf(14),
    marginBottom: sv(8),
  },
  retryText: {
    color: COLORS.softGold,
    fontSize: sf(14),
    fontWeight: "800",
  },
});
