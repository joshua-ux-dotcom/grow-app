import { supabase } from './supabase';

export async function getActiveVideos() {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('is_active', true);

  if (error) {
    throw error;
  }

  return data.map((video) => ({
    id: video.id,
    source: video.video_url,
    saved: false,
  }));
}