import { Redirect } from 'expo-router';
import { useAuth } from './_layout';

export default function Index() {
  const session = useAuth();

  // _layout zeigt den Spinner solange session === undefined,
  // hier kommt der Code also erst an wenn session bekannt ist
  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
