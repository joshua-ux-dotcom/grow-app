import { logger } from "../../../lib/logger";
import { decode } from "base64-arraybuffer";
import { supabase } from "../../../services/supabaseClient";

const FEEDBACK_IMAGE_BUCKET = "feedback-images";
let feedbackFileCounter = 0;

export function getSafeFeedbackFileExtension(fileName, mimeType) {
  const rawExt = fileName?.split(".").pop()?.toLowerCase();
  if (rawExt && /^(?:jpe?g|png|webp)$/.test(rawExt)) return rawExt;
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

const MIME_BY_EXTENSION = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function normalizeFeedbackImages(selectedImages) {
  if (!Array.isArray(selectedImages) || selectedImages.length > 5) {
    throw new Error("Feedback supports at most 5 images.");
  }
  return selectedImages.map((selectedImage) => {
    if (
      !selectedImage ||
      typeof selectedImage !== "object" ||
      Array.isArray(selectedImage)
    ) {
      throw new Error("Feedback image is malformed.");
    }
    const base64 =
      typeof selectedImage.base64 === "string"
        ? selectedImage.base64.trim()
        : "";
    const uri =
      typeof selectedImage.uri === "string" ? selectedImage.uri.trim() : "";
    if (!base64 || !uri) throw new Error("Feedback image is malformed.");
    const extension = getSafeFeedbackFileExtension(
      selectedImage.fileName,
      selectedImage.mimeType,
    );
    const mimeType = MIME_BY_EXTENSION[extension] ?? "image/jpeg";
    return { ...selectedImage, base64, uri, mimeType, extension };
  });
}

export function createFeedbackImageFileName({
  now = Date.now,
  random = Math.random,
} = {}) {
  feedbackFileCounter = (feedbackFileCounter + 1) % Number.MAX_SAFE_INTEGER;
  const randomSuffix = Array.from({ length: 4 }, () =>
    Math.floor(random() * Number.MAX_SAFE_INTEGER)
      .toString(36)
      .padStart(10, "0"),
  ).join("");
  return `feedback-${Math.max(0, Number(now()) || 0).toString(36)}-${feedbackFileCounter.toString(36)}-${randomSuffix}`;
}

export function createFeedbackImagePath(
  userId,
  selectedImage,
  createFileName = createFeedbackImageFileName,
) {
  if (!userId) throw new Error("Feedback userId is missing.");
  return `${userId}/${createFileName()}.${selectedImage.extension ?? getSafeFeedbackFileExtension(selectedImage?.fileName, selectedImage?.mimeType)}`;
}

export async function uploadFeedbackImage({
  selectedImage,
  filePath,
  client = supabase,
  decodeBase64 = decode,
}) {
  if (!selectedImage?.base64 || !selectedImage?.uri)
    throw new Error("Feedback image is malformed.");
  if (!filePath) throw new Error("Feedback image path is missing.");
  const arrayBuffer = decodeBase64(selectedImage.base64);
  const { error } = await client.storage
    .from(FEEDBACK_IMAGE_BUCKET)
    .upload(filePath, arrayBuffer, {
      contentType: selectedImage.mimeType || "image/jpeg",
      upsert: false,
    });
  if (error) throw error;
  const { data } = client.storage
    .from(FEEDBACK_IMAGE_BUCKET)
    .getPublicUrl(filePath);
  const imageUrl = data?.publicUrl;
  if (!imageUrl) throw new Error("Feedback image public URL is missing.");
  return { imageUrl, imagePath: filePath };
}

export async function removeUploadedFeedbackImages(
  imagePaths,
  client = supabase,
) {
  const uniquePaths = [
    ...new Set(
      (Array.isArray(imagePaths) ? imagePaths : []).filter(
        (path) => typeof path === "string" && path.length > 0,
      ),
    ),
  ];
  if (uniquePaths.length === 0) return;
  const { error } = await client.storage
    .from(FEEDBACK_IMAGE_BUCKET)
    .remove(uniquePaths);
  if (error) throw error;
}

async function cleanupAfterFailure(imagePaths, originalError, client) {
  try {
    await removeUploadedFeedbackImages(imagePaths, client);
  } catch (cleanupError) {
    logger.error(
      "Feedback-Bilder konnten nach fehlgeschlagenem Senden nicht bereinigt werden.",
      {
        cleanupError,
        originalError,
        imagePaths,
      },
    );
  }
}

async function awardFeedbackGrowPoints(client) {
  try {
    const { data, error } = await client.rpc("award_feedback_points");
    if (error) throw error;
    return Boolean(data);
  } catch (error) {
    logger.debug(
      "Grow Points für Feedback konnten nicht vergeben werden:",
      error,
    );
    return false;
  }
}

export async function sendFeedback(
  { userId, selectedType, selectedImportance, text, selectedImages = [] },
  {
    client = supabase,
    createFileName = createFeedbackImageFileName,
    decodeBase64 = decode,
  } = {},
) {
  const trimmedText = typeof text === "string" ? text.trim() : "";
  if (!userId) throw new Error("Feedback userId is missing.");
  if (!trimmedText) throw new Error("Feedback text is empty.");
  const normalizedImages = normalizeFeedbackImages(selectedImages);

  const attemptedPaths = [];
  const uploads = [];
  try {
    for (const selectedImage of normalizedImages) {
      const filePath = createFeedbackImagePath(
        userId,
        selectedImage,
        createFileName,
      );
      attemptedPaths.push(filePath);
      uploads.push(
        await uploadFeedbackImage({
          selectedImage,
          filePath,
          client,
          decodeBase64,
        }),
      );
    }
  } catch (error) {
    await cleanupAfterFailure(attemptedPaths, error, client);
    throw error;
  }

  const imageUrls = uploads.map((upload) => upload.imageUrl);
  const imagePaths = uploads.map((upload) => upload.imagePath);
  const firstUpload = uploads[0] ?? null;
  const { error: feedbackError } = await client.from("feedback").insert({
    user_id: userId,
    feedback_type: selectedType,
    importance: selectedImportance,
    message: trimmedText,
    image_urls: imageUrls.length ? imageUrls : null,
    image_paths: imagePaths.length ? imagePaths : null,
    image_url: firstUpload?.imageUrl ?? null,
    image_path: firstUpload?.imagePath ?? null,
  });
  if (feedbackError) {
    await cleanupAfterFailure(attemptedPaths, feedbackError, client);
    throw feedbackError;
  }
  return { pointsAwarded: await awardFeedbackGrowPoints(client) };
}
