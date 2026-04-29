import { supabase } from '../../../services/supabaseClient';

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user?.id ?? null;
}

export async function getActiveVideos() {
  const userId = await getCurrentUserId();

  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('*')
    .eq('is_active', true);

  if (videosError) {
    throw videosError;
  }

  let bookmarkedVideoIds = [];

  if (userId) {
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('video_bookmarks')
      .select('video_id')
      .eq('user_id', userId);

    if (bookmarksError) {
      throw bookmarksError;
    }

    bookmarkedVideoIds = bookmarks.map((bookmark) => bookmark.video_id);
  }

  return videos.map((video) => ({
    id: video.id,
    title: video.title,
    source: video.video_url,
    thumbnail: video.thumbnail_url,
    saved: bookmarkedVideoIds.includes(video.id),
  }));
}

export async function getSavedVideos() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('video_bookmarks')
    .select(`
      video_id,
      created_at,
      videos (
        id,
        title,
        video_url,
        thumbnail_url,
        is_active
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data
    .filter((bookmark) => bookmark.videos?.is_active)
    .map((bookmark) => ({
      id: bookmark.videos.id,
      title: bookmark.videos.title,
      source: bookmark.videos.video_url,
      thumbnail: bookmark.videos.thumbnail_url,
      saved: true,
      savedAt: bookmark.created_at,
    }));
}

export async function getSavedVideoIds() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('video_bookmarks')
    .select('video_id')
    .eq('user_id', userId);

  if (error) throw error;

  return data.map((b) => b.video_id);
}

export async function toggleVideoBookmark(videoId, currentlySaved) {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error('Kein eingeloggter User gefunden.');
  }

  if (currentlySaved) {
    const { error } = await supabase
      .from('video_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('video_id', videoId);

    if (error) {
      throw error;
    }

    return false;
  }

  const { error } = await supabase
    .from('video_bookmarks')
    .insert({
      user_id: userId,
      video_id: videoId,
    });

  if (error) {
    throw error;
  }

  return true;
}