import { supabase } from './supabase';

export async function awardVideoPoints(userId, videoId) {
  const { data: existingView, error: fetchViewError } = await supabase
    .from('video_views')
    .select('id, points_awarded, progress_percent')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .maybeSingle();

  if (fetchViewError) {
    throw fetchViewError;
  }

  if (existingView?.points_awarded) {
    return {
      awarded: false,
      reason: 'already_awarded',
    };
  }

  if (existingView) {
    const { error: updateViewError } = await supabase
      .from('video_views')
      .update({
        progress_percent: 0.8,
        points_awarded: true,
      })
      .eq('id', existingView.id);

    if (updateViewError) {
      throw updateViewError;
    }
  } else {
    const { error: insertViewError } = await supabase
      .from('video_views')
      .insert({
        user_id: userId,
        video_id: videoId,
        progress_percent: 0.8,
        points_awarded: true,
      });

    if (insertViewError) {
      throw insertViewError;
    }
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
      grow_points: currentGrowPoints + 1,
    })
    .eq('id', userId);

  if (profileUpdateError) {
    throw profileUpdateError;
  }

  const { error: logError } = await supabase
    .from('grow_points_log')
    .insert({
      user_id: userId,
      points: 1,
      reason: 'video_watched',
    });

  if (logError) {
    throw logError;
  }

  return {
    awarded: true,
    reason: 'success',
  };
}