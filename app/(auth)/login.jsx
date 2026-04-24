import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../services/supabaseClient'
import { COLORS } from '../../constants/colors';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setErrorText('');

    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername || !password) {
      setErrorText('Bitte Username und Passwort eingeben.');
      return;
    }

    const email = `${cleanUsername}@growapp.com`;

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorText('Username oder Passwort ist falsch.');
        return;
      }

      router.replace('/(tabs)');
    } catch (err) {
      setErrorText('Login fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>Grow</Text>
        <Text style={styles.subtitle}>Willkommen zurück</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="z. B. user1"
          placeholderTextColor={COLORS.mutedGold}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <Text style={styles.label}>Passwort</Text>
        <View style={styles.passwordWrap}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Passwort"
            placeholderTextColor={COLORS.mutedGold}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.passwordInput}
          />

          <Pressable
            onPress={() => setShowPassword((current) => !current)}
            hitSlop={10}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={COLORS.gold}
            />
          </Pressable>
        </View>

        {!!errorText && <Text style={styles.error}>{errorText}</Text>}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && !loading && styles.buttonPressed,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.black} />
          ) : (
            <Text style={styles.buttonText}>Einloggen</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.registerLink}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.registerText}>
            Noch keinen Account? <Text style={styles.registerGold}>Registrieren</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: 24,
    padding: 22,
  },
  logo: {
    color: COLORS.gold,
    fontSize: 42,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.mutedLilac,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
  },
  label: {
    color: COLORS.softGold,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: 14,
    color: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  passwordWrap: {
    backgroundColor: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    color: COLORS.white,
    paddingVertical: 13,
    fontSize: 15,
  },
  error: {
    color: '#ff7a7a',
    marginTop: 14,
    fontSize: 13,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.gold,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '800',
  },
  registerLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  registerText: {
    color: COLORS.mutedLilac,
    fontSize: 13,
  },
  registerGold: {
    color: COLORS.gold,
    fontWeight: '800',
  },
});