import { supabase } from '../../../services/supabaseClient';
 
export async function fetchRating(userId, videoId) {
  const { data, error } = await supabase
    .from('video_ratings')
    .select('rating')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .maybeSingle();
 
  if (error) throw error;
  return data?.rating ?? null;
}
 
export async function upsertRating(userId, videoId, rating) {
  const { error } = await supabase
    .from('video_ratings')
    .upsert(
      { user_id: userId, video_id: videoId, rating },
      { onConflict: 'user_id,video_id' }
    );
 
  if (error) throw error;
}