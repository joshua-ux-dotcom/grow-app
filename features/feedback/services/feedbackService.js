import { decode } from 'base64-arraybuffer';
import { supabase } from '../../../services/supabaseClient';

export async function uploadFeedbackImage({ selectedImage, userId }) {
  if (!selectedImage) {
    return { imageUrl: null, imagePath: null };
  }

  const fileExt = selectedImage.fileName?.split('.').pop() || 'jpg';
  const safeUserId = userId || 'anonymous';
  const filePath = `${safeUserId}/${Date.now()}.${fileExt}`;

  const arrayBuffer = decode(selectedImage.base64);

  const { error: uploadError } = await supabase.storage
    .from('feedback-images')
    .upload(filePath, arrayBuffer, {
      contentType: selectedImage.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('feedback-images')
    .getPublicUrl(filePath);

  return {
    imageUrl: data.publicUrl,
    imagePath: filePath,
  };
}

export async function sendFeedback({
  userId,
  selectedType,
  selectedImportance,
  text,
  selectedImage,
}) {
  let imageUrl = null;
  let imagePath = null;

  if (selectedImage) {
    const uploadResult = await uploadFeedbackImage({
      selectedImage,
      userId,
    });

    imageUrl = uploadResult.imageUrl;
    imagePath = uploadResult.imagePath;
  }

  const { error: feedbackError } = await supabase.from('feedback').insert({
    user_id: userId,
    feedback_type: selectedType,
    importance: selectedImportance,
    message: text.trim(),
    image_url: imageUrl,
    image_path: imagePath,
  });

  if (feedbackError) {
    throw feedbackError;
  }

  const { data: profile, error: profileFetchError } = await supabase
    .from('profiles')
    .select('grow_points')
    .eq('id', userId)
    .single();

  if (profileFetchError) {
    throw profileFetchError;
  }

  const currentGrowPoints = profile?.grow_points ?? 0;

  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({
      grow_points: currentGrowPoints + 5,
    })
    .eq('id', userId);

  if (profileUpdateError) {
    throw profileUpdateError;
  }

  const { error: logError } = await supabase
    .from('grow_points_log')
    .insert({
      user_id: userId,
      points: 5,
      reason: 'feedback_sent',
    });

  if (logError) {
    throw logError;
  }
}