import { useEffect, useState, createContext, useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';

import { supabase } from '../services/supabaseClient';
import { COLORS } from '../constants/colors';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export default function RootLayout() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    // Einmaliger Check beim Start
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    // Echtzeit-Listener: reagiert auf Login, Logout, Token-Refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // undefined = noch nicht geprüft, null = kein User, object = eingeloggt
  if (session === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.gold} />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={session}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthContext.Provider>
  );
}