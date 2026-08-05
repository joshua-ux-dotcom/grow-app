import { logger } from "../../../lib/logger";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { sendFeedback } from "../services/feedbackService";
import { supabase } from "../../../services/supabaseClient";

const DEFAULT_TYPE = "Idee / Vorschlag";
const DEFAULT_IMPORTANCE = 4;
export const MAX_FEEDBACK_IMAGES = 5;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_TOTAL_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;

export function getFeedbackImageRemainingCapacity(count) {
  return Math.max(
    0,
    MAX_FEEDBACK_IMAGES - Math.max(0, Number.isInteger(count) ? count : 0),
  );
}

export function normalizeReportedFileSize(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error("Invalid reported image size.");
  }
  return value;
}

export function mergeFeedbackImages(current, assets) {
  const seen = new Set(current.map((image) => image.assetId || image.uri));
  const merged = [...current];
  for (const asset of assets) {
    const key = asset?.assetId || asset?.uri;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(asset);
  }
  return merged;
}

export function prepareFeedbackImageSelection(current, assets, now = Date.now) {
  if (
    !Array.isArray(assets) ||
    assets.some((asset) => !asset?.uri || !asset?.base64)
  ) {
    return { error: "malformed", images: current };
  }
  let normalized;
  try {
    normalized = assets.map((asset, index) => ({
      assetId: asset.assetId ?? null,
      uri: asset.uri,
      base64: asset.base64,
      fileSize: normalizeReportedFileSize(asset.fileSize),
      mimeType: asset.mimeType || "image/jpeg",
      fileName: asset.fileName || `feedback-${now()}-${index}.jpg`,
    }));
  } catch {
    return { error: "invalid-size", images: current };
  }
  if (
    normalized.some(
      (asset) =>
        asset.fileSize !== null && asset.fileSize > MAX_IMAGE_SIZE_BYTES,
    )
  ) {
    return { error: "file-too-large", images: current };
  }
  const images = mergeFeedbackImages(current, normalized).slice(
    0,
    MAX_FEEDBACK_IMAGES,
  );
  const totalSize = images.reduce(
    (sum, image) => sum + (image.fileSize ?? 0),
    0,
  );
  if (totalSize > MAX_TOTAL_IMAGE_SIZE_BYTES)
    return { error: "total-too-large", images: current };
  return { error: null, images };
}

export function removeFeedbackImage(images, index) {
  return images.filter((_, imageIndex) => imageIndex !== index);
}

export function useFeedbackForm() {
  const isMountedRef = useRef(true);
  const isPickingImageRef = useRef(false);
  const isSendingRef = useRef(false);

  const [selectedType, setSelectedType] = useState(DEFAULT_TYPE);
  const [selectedImportance, setSelectedImportance] =
    useState(DEFAULT_IMPORTANCE);
  const [text, setText] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const clearStatus = useCallback(() => {
    if (!isMountedRef.current) return;

    setSendError(null);
  }, []);

  const resetForm = useCallback(() => {
    if (!isMountedRef.current) return;

    setText("");
    setSelectedImages([]);
    setSelectedType(DEFAULT_TYPE);
    setSelectedImportance(DEFAULT_IMPORTANCE);
  }, []);

  const handlePickImage = useCallback(async () => {
    if (isPickingImageRef.current) return;
    const remaining = getFeedbackImageRemainingCapacity(selectedImages.length);
    if (remaining <= 0) {
      Alert.alert(
        "Maximal 5 Bilder",
        "Entferne zuerst ein Bild, um ein anderes auszuwählen.",
      );
      return;
    }

    isPickingImageRef.current = true;

    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!isMountedRef.current) return;

      if (!permissionResult.granted) {
        Alert.alert(
          "Berechtigung nötig",
          "Bitte erlaube den Zugriff auf deine Fotos.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!isMountedRef.current || result.canceled) return;

      const prepared = prepareFeedbackImageSelection(
        selectedImages,
        result.assets ?? [],
      );
      if (prepared.error === "malformed") {
        Alert.alert("Fehler", "Bild konnte nicht vorbereitet werden.");
        return;
      }
      if (prepared.error === "invalid-size") {
        Alert.alert("Fehler", "Die gemeldete Bildgröße ist ungültig.");
        return;
      }
      if (prepared.error === "file-too-large") {
        Alert.alert("Bild zu groß", "Jedes Bild darf maximal 5 MB groß sein.");
        return;
      }
      if (prepared.error === "total-too-large") {
        Alert.alert(
          "Bilder zu groß",
          "Die ausgewählten Bilder dürfen zusammen maximal 15 MB groß sein.",
        );
        return;
      }
      setSelectedImages(prepared.images);

      clearStatus();
    } catch (error) {
      logger.debug("Fehler beim Auswählen des Feedback-Bildes:", error);

      if (isMountedRef.current) {
        Alert.alert("Fehler", "Bild konnte nicht ausgewählt werden.");
      }
    } finally {
      isPickingImageRef.current = false;
    }
  }, [clearStatus, selectedImages]);

  const handleRemoveImage = useCallback(
    (index) => {
      setSelectedImages((images) => removeFeedbackImage(images, index));
      clearStatus();
    },
    [clearStatus],
  );

  const handleSend = useCallback(async () => {
    if (isSendingRef.current) return;

    if (!text.trim()) {
      Alert.alert("Hinweis", "Bitte schreibe zuerst dein Feedback.");
      return;
    }

    isSendingRef.current = true;

    try {
      setSending(true);
      clearStatus();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("Kein User eingeloggt");
      }

      const result = await sendFeedback({
        userId: user.id,
        selectedType,
        selectedImportance,
        text,
        selectedImages,
      });

      if (!isMountedRef.current) return;

      resetForm();
      Alert.alert(
        "Feedback gesendet",
        result?.pointsAwarded
          ? "Danke für dein Feedback! Du hast 5 Grow Points erhalten."
          : "Danke für dein Feedback!",
      );
    } catch (error) {
      logger.debug("Fehler beim Senden von Feedback:", error);

      if (isMountedRef.current) {
        setSendError(
          "Feedback konnte nicht gesendet werden. Bitte versuche es erneut.",
        );
      }
    } finally {
      isSendingRef.current = false;

      if (isMountedRef.current) {
        setSending(false);
      }
    }
  }, [
    clearStatus,
    resetForm,
    selectedImages,
    selectedImportance,
    selectedType,
    text,
  ]);

  return {
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
  };
}
