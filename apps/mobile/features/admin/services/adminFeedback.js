import { supabase } from "../../../services/supabaseClient";
import { logger } from "../../../lib/logger";

const isPublicUrl = (value) =>
  typeof value === "string" && /^https?:\/\//i.test(value);
function parseJson(value, fallback) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
export function uniqueStrings(value) {
  const parsed = parseJson(value, []);
  return [
    ...new Set(
      Array.isArray(parsed)
        ? parsed.filter(
            (item) => typeof item === "string" && item.trim().length > 0,
          )
        : [],
    ),
  ];
}

export function normalizeAdminFeedbackItem(item, index = 0) {
  const parsedFeedback = parseJson(item?.feedback, {});
  const feedback =
    parsedFeedback &&
    typeof parsedFeedback === "object" &&
    !Array.isArray(parsedFeedback)
      ? parsedFeedback
      : {};
  const arrayUrls = uniqueStrings(feedback.image_urls).filter(isPublicUrl);
  const legacyUrl = [
    feedback.image_url,
    feedback.imageUrl,
    feedback.public_image_url,
  ].find(isPublicUrl);
  const imageUrls =
    arrayUrls.length > 0 ? arrayUrls : legacyUrl ? [legacyUrl] : [];
  const arrayPaths = uniqueStrings(feedback.image_paths);
  const legacyPath =
    typeof feedback.image_path === "string" && feedback.image_path
      ? feedback.image_path
      : null;
  const imagePaths =
    arrayPaths.length > 0 ? arrayPaths : legacyPath ? [legacyPath] : [];
  return {
    id: String(feedback.id ?? index),
    username: item?.username ?? "Unbekannter User",
    userId: feedback.user_id ?? null,
    type: feedback.feedback_type ?? feedback.type ?? "Feedback",
    importance: feedback.importance ?? feedback.priority ?? null,
    message: feedback.message ?? feedback.text ?? feedback.feedback_text ?? "",
    imageUrls,
    imagePaths,
    imageUrl: imageUrls[0] ?? null,
    status: feedback.status ?? "new",
    createdAt: feedback.created_at ?? null,
    raw: feedback,
  };
}

export async function loadAdminFeedbackList(limit = 100) {
  const { data, error } = await supabase.rpc("get_admin_feedback_list", {
    limit_count: limit,
  });

  if (error) {
    throw error;
  }

  return (data ?? []).map(normalizeAdminFeedbackItem);
}

export async function deleteAdminFeedback(feedbackId, imagePaths = []) {
  const { error } = await supabase.rpc("delete_admin_feedback", {
    feedback_id: feedbackId,
  });

  if (error) {
    throw error;
  }
  const paths = uniqueStrings(imagePaths);
  if (paths.length > 0) {
    try {
      const { error: cleanupError } = await supabase.storage
        .from("feedback-images")
        .remove(paths);
      if (cleanupError)
        logger.error(
          "Gelöschte Feedback-Bilder konnten nicht bereinigt werden.",
          cleanupError,
        );
    } catch (cleanupError) {
      logger.error(
        "Gelöschte Feedback-Bilder konnten nicht bereinigt werden.",
        cleanupError,
      );
    }
  }
}
