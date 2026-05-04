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
import { s, sv, sf } from '../../constants/layout';
 
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
    const cleanCode = code.trim().toUpperCase();
 
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
 
      const { data: existingProfile, error: usernameError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();
 
      if (usernameError) {
        setErrorText('Username konnte nicht geprüft werden.');
        return;
      }
 
      if (existingProfile) {
        setErrorText('Username ist bereits vergeben.');
        return;
      }
 
      // Auth Account erstellen
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
 
      if (error || !data.user) {
        const message = error?.message?.toLowerCase() || '';
 
        if (message.includes('already registered') || message.includes('already been registered')) {
          setErrorText('Username ist bereits vergeben.');
        } else if (message.includes('password')) {
          setErrorText('Passwort ist zu schwach oder zu kurz.');
        } else if (message.includes('rate limit')) {
          setErrorText('Zu viele Versuche. Bitte warte kurz und versuche es später erneut.');
        } else {
          setErrorText('Registrierung fehlgeschlagen. Bitte prüfe deine Eingaben.');
        }
 
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
        const { data: claimed, error: claimError } = await supabase.rpc(
          'claim_beta_code',
          {
            input_code: cleanCode,
            input_user_id: data.user.id,
          }
        );
 
        if (claimError || !claimed) {
          setErrorText('Beta-Code konnte nicht aktiviert werden.');
          return;
        }
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
 
        <Pressable
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}
        >
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
    paddingHorizontal: s(24),
  },
  card: {
    backgroundColor: COLORS.darkCard,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: s(24),
    padding: s(22),
  },
  logo: {
    color: COLORS.gold,
    fontSize: sf(42),
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.mutedLilac,
    textAlign: 'center',
    marginBottom: sv(22),
    marginTop: sv(6),
  },
  input: {
    backgroundColor: COLORS.black,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: s(14),
    padding: s(14),
    marginTop: sv(12),
  },
  passwordWrap: {
    backgroundColor: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: s(14),
    paddingHorizontal: s(14),
    marginTop: sv(12),
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    color: COLORS.white,
    paddingVertical: sv(14),
  },
  button: {
    backgroundColor: COLORS.gold,
    borderRadius: s(16),
    paddingVertical: sv(14),
    alignItems: 'center',
    marginTop: sv(22),
  },
  buttonText: {
    color: COLORS.black,
    fontWeight: '800',
    fontSize: sf(16),
  },
  error: {
    color: COLORS.errorLight,
    marginTop: sv(12),
    textAlign: 'center',
  },
  link: {
    color: COLORS.mutedLilac,
    textAlign: 'center',
    marginTop: sv(18),
  },
  gold: {
    color: COLORS.gold,
    fontWeight: '800',
  },
});