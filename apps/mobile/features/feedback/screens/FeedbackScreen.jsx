import { logger } from "../../../lib/logger";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Text,
  StyleSheet,
  ScrollView,
  View,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import FeedbackHero from "../components/FeedbackHero";
import FeedbackTypeCards from "../components/FeedbackTypeCards";
import FeedbackTextInputCard from "../components/FeedbackTextInputCard";
import FeedbackImportanceCircles from "../components/FeedbackImportanceCircles";
import FeedbackImageUploadCard from "../components/FeedbackImageUploadCard";
import FeedbackInfoCards from "../components/FeedbackInfoCards";
import FeedbackSendButton from "../components/FeedbackSendButton";
import ImageLightboxModal from "../../../components/ImageLightboxModal";
import { useFeedbackForm } from "../hooks/useFeedbackForm";
import { COLORS } from "../../../constants/colors";
import { preloadFeedbackImageAssets } from "../../../constants/toolAssets";
import { s, sv, sf } from "../../../constants/layout";
import { useOnboarding } from "../../onboarding/context/OnboardingContext";

const GROW_LOGO_HEADER = require("../../../assets/images/grow_banner_lossless.webp");
const FEEDBACK_TOUR_SCROLL_Y = sv(255);
const FEEDBACK_TOUR_CONTENT_OFFSET = { x: 0, y: FEEDBACK_TOUR_SCROLL_Y };

export default function FeedbackScreen() {
  const [feedbackAssetsReady, setFeedbackAssetsReady] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const scrollRef = useRef(null);
  const insets = useSafeAreaInsets();
  const bottomContentPadding = sv(72) + Math.max(insets.bottom, 0);
  const footerSafeStyle =
    Platform.OS === "android"
      ? {
          marginTop: -sv(24),
          marginBottom: sv(24) + Math.max(insets.bottom, 0),
        }
      : { marginBottom: sv(14) + Math.max(insets.bottom, 0) };
  const { isTourActive, currentStep } = useOnboarding();
  const isFeedbackTutorialStep = isTourActive && currentStep?.id === "feedback";
  const shouldHideAndroidTutorialReset =
    Platform.OS === "android" && isTourActive && !isFeedbackTutorialStep;

  useEffect(() => {
    let mounted = true;

    preloadFeedbackImageAssets()
      .catch((err) => {
        logger.warn("Feedback image preloading failed", err);
      })
      .finally(() => {
        if (mounted) {
          setFeedbackAssetsReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (!feedbackAssetsReady) return;

    // Android zeigt den Scroll-Reset beim Tutorial-Wechsel 8 -> 9 sichtbar als
    // kurzes Hochspringen. Deshalb setzen wir nur dort während des versteckten
    // Moments zurück. iOS bleibt unverändert.
    if (isTourActive) {
      if (isFeedbackTutorialStep) {
        scrollRef.current?.scrollTo({
          y: FEEDBACK_TOUR_SCROLL_Y,
          animated: false,
        });
      } else if (Platform.OS === "android") {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }

      return;
    }

    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [feedbackAssetsReady, isFeedbackTutorialStep, isTourActive]);

  useFocusEffect(
    useCallback(() => {
      if (!feedbackAssetsReady || isTourActive) return undefined;

      const frame = requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });

      return () => cancelAnimationFrame(frame);
    }, [feedbackAssetsReady, isTourActive]),
  );

  const {
    selectedType,
    setSelectedType,
    selectedImportance,
    setSelectedImportance,
    text,
    setText,
    selectedImages,
    sending,
    sendError,
    handlePickImage,
    handleRemoveImage,
    handleSend,
    clearStatus,
  } = useFeedbackForm();

  if (!feedbackAssetsReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.gold} />
          <Text style={styles.loadingText}>Feedback wird geladen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={
          shouldHideAndroidTutorialReset
            ? styles.hiddenTutorialContent
            : undefined
        }
        contentOffset={
          isFeedbackTutorialStep ? FEEDBACK_TOUR_CONTENT_OFFSET : undefined
        }
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomContentPadding },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      >
        <Image
          source={GROW_LOGO_HEADER}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <FeedbackHero />

        <Text style={styles.sectionTitle}>WAS MÖCHTEST DU FEEDBACK GEBEN?</Text>

        <FeedbackTypeCards
          selectedType={selectedType}
          onSelect={(type) => {
            setSelectedType(type);
            clearStatus();
          }}
        />

        <Text style={styles.sectionTitle}>WIE KÖNNEN WIR GROW VERBESSERN?</Text>

        <FeedbackTextInputCard
          value={text}
          onChangeText={(value) => {
            setText(value);
            clearStatus();
          }}
        />

        <Text style={styles.sectionTitle}>WIE WICHTIG IST DIR DAS?</Text>
        <Text style={styles.smallDescription}>
          Deine Einschätzung hilft uns zu priorisieren.
        </Text>

        <FeedbackImportanceCircles
          selectedImportance={selectedImportance}
          onSelect={(value) => {
            setSelectedImportance(value);
            clearStatus();
          }}
        />

        <Text style={styles.sectionTitle}>
          SCREENSHOT HINZUFÜGEN (OPTIONAL)
        </Text>
        <Text style={styles.smallDescription}>
          Ein Bild sagt mehr als 1.000 Worte.
        </Text>

        <FeedbackImageUploadCard
          selectedImages={selectedImages}
          onPickImage={handlePickImage}
          onRemoveImage={handleRemoveImage}
          onOpenImage={setLightboxIndex}
        />

        <FeedbackInfoCards />

        <FeedbackSendButton sending={sending} onPress={handleSend} />

        {sendError && <Text style={styles.errorText}>{sendError}</Text>}

        <Text style={[styles.footerText, footerSafeStyle]}>
          Danke, dass du Grow besser machst. 🙏
        </Text>
      </ScrollView>
      <ImageLightboxModal
        visible={lightboxIndex !== null}
        imageUrls={selectedImages.map((image) => image.uri)}
        initialIndex={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(24),
  },
  loadingText: {
    color: COLORS.textDim,
    fontSize: sf(13),
    fontWeight: "600",
    marginTop: sv(12),
    textAlign: "center",
  },
  hiddenTutorialContent: {
    opacity: 0,
  },
  content: {
    paddingHorizontal: s(20),
    paddingTop: 0,
    paddingBottom: 40,
  },
  logoImage: {
    alignSelf: "center",
    width: s(185),
    height: sv(42),
    marginTop: sv(4),
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: sf(13),
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: sv(12),
    marginTop: sv(4),
  },
  smallDescription: {
    color: COLORS.textDim,
    fontSize: sf(12),
    marginBottom: sv(14),
  },
  footerText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: sf(12),
  },
  errorText: {
    textAlign: "center",
    color: COLORS.error,
    fontSize: sf(13),
    lineHeight: 18,
    marginBottom: sv(14),
  },
});
