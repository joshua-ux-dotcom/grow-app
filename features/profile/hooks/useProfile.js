import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
 
import { supabase } from '../../../services/supabaseClient';
import { loadProfileData } from '../services/profiles';
 
export function useProfile() {
  const [username, setUsername] = useState('Grower');
  const [growPoints, setGrowPoints] = useState(0);
 
  const load = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return;
 
      const profile = await loadProfileData(user.id);
      setUsername(profile.username);
      setGrowPoints(profile.growPoints);
    } catch (err) {
      console.log('Fehler beim Laden des Profils:', err);
    }
  }, []);
 
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
 
  return { username, growPoints };
}