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

import { supabase } from '../../services/supabaseClient';
import { COLORS } from '../../constants/colors';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  async function handleRegister() {
    setErrorText('');

    const cleanUsername = username.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanUsername || !password || !password2 || !cleanCode) {
      setErrorText('Bitte alle Felder ausfüllen.');
      return;
    }

    if (password !== password2) {
      setErrorText('Passwörter stimmen nicht überein.');
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorText('Username zu kurz.');
      return;
    }

    try {
      setLoading(true);

      // Beta Code prüfen
      const { data: betaRow, error: betaError } = await supabase
        .from('beta_access_codes')
        .select('*')
        .eq('code', cleanCode)
        .is('used_by', null)
        .single();

      if (betaError || !betaRow) {
        setErrorText('Ungültiger oder bereits genutzter Beta-Code.');
        return;
      }

      const email = `${cleanUsername}@growapp.com`;

      // Auth Account erstellen
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error || !data.user) {
        setErrorText(error?.message || 'Registrierung fehlgeschlagen.');
        return;
      }

      // Profil anlegen
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username: cleanUsername,
          grow_points: 0,
        });

        if (profileError) {
        console.log('PROFILE ERROR:', profileError);
        setErrorText(profileError.message);
        return;
        }

      // Beta Code verbrauchen

      router.replace('/(tabs)');
    } catch (err) {
      setErrorText('Registrierung fehlgeschlagen.');
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
        <Text style={styles.subtitle}>Beta Zugang erstellen</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={COLORS.mutedGold}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Beta Code"
          placeholderTextColor={COLORS.mutedGold}
          value={code}
          onChangeText={setCode}
        />

        <View style={styles.passwordWrap}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Passwort"
            placeholderTextColor={COLORS.mutedGold}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={COLORS.gold}
            />
          </Pressable>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Passwort wiederholen"
          placeholderTextColor={COLORS.mutedGold}
          value={password2}
          onChangeText={setPassword2}
          secureTextEntry={!showPassword}
        />

        {!!errorText && <Text style={styles.error}>{errorText}</Text>}

        <Pressable style={styles.button} onPress={handleRegister}>
          {loading ? (
            <ActivityIndicator color={COLORS.black} />
          ) : (
            <Text style={styles.buttonText}>Registrieren</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.link}>
            Bereits Account? <Text style={styles.gold}>Einloggen</Text>
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
  },
  subtitle: {
    color: COLORS.mutedLilac,
    textAlign: 'center',
    marginBottom: 22,
    marginTop: 6,
  },
  input: {
    backgroundColor: COLORS.black,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  passwordWrap: {
    backgroundColor: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    color: COLORS.white,
    paddingVertical: 14,
  },
  button: {
    backgroundColor: COLORS.gold,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  buttonText: {
    color: COLORS.black,
    fontWeight: '800',
    fontSize: 16,
  },
  error: {
    color: '#ff7a7a',
    marginTop: 12,
    textAlign: 'center',
  },
  link: {
    color: COLORS.mutedLilac,
    textAlign: 'center',
    marginTop: 18,
  },
  gold: {
    color: COLORS.gold,
    fontWeight: '800',
  },
});