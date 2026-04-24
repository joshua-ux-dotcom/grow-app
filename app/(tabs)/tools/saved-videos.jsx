import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../constants/colors';
import { getSavedVideos } from '../../../features/feed/services/videos';

export default function SavedVideosScreen() {
  const [savedVideos, setSavedVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState(null);

  const loadSavedVideos = useCallback(async () => {
    try {
      setErrorText(null);
      setIsLoading(true);

      const videos = await getSavedVideos();

      setSavedVideos(videos);
    } catch (error) {
      console.log('Fehler beim Laden gespeicherter Videos:', error);
      setErrorText('Gespeicherte Videos konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSavedVideos();
    }, [loadSavedVideos])
  );

  function openSavedFeed(index) {
    router.push({
      pathname: '/saved-feed',
      params: {
        initialIndex: String(index),
      },
    });
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="chevron-left" size={26} color={COLORS.softGold} />
        </Pressable>

        <View>
          <Text style={styles.topLabel}>GROW</Text>
          <Text style={styles.title}>Gespeicherte Videos</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Deine persönliche Motivations-Bibliothek.
      </Text>

      {isLoading && (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>Lade gespeicherte Videos...</Text>
        </View>
      )}

      {!isLoading && errorText && (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>Fehler</Text>
          <Text style={styles.stateText}>{errorText}</Text>

          <Pressable style={styles.retryButton} onPress={loadSavedVideos}>
            <Text style={styles.retryButtonText}>Erneut versuchen</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !errorText && savedVideos.length === 0 && (
        <View style={styles.stateBox}>
          <Ionicons name="bookmark-outline" size={42} color={COLORS.gold} />
          <Text style={styles.stateTitle}>Noch nichts gespeichert</Text>
          <Text style={styles.stateText}>
            Speichere Videos im Feed, um sie hier wiederzufinden.
          </Text>
        </View>
      )}

      {!isLoading && !errorText && savedVideos.length > 0 && (
        <FlatList
          data={savedVideos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Pressable
              style={styles.videoCard}
              onPress={() => openSavedFeed(index)}
            >
              <View style={styles.thumbnail}>
                <Ionicons name="play" size={26} color={COLORS.black} />
              </View>

              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>
                  Gespeichertes Video {index + 1}
                </Text>
                <Text style={styles.videoSubtitle}>
                  Tippen zum Öffnen im Saved Feed
                </Text>
              </View>

              <Ionicons name="bookmark" size={24} color={COLORS.gold} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.black,
    paddingTop: 66,
    paddingHorizontal: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    backgroundColor: COLORS.darkCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topLabel: {
    color: '#a07d47',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 3,
  },
  title: {
    color: COLORS.paleGold,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.mutedGold,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 22,
  },
  list: {
    paddingBottom: 30,
  },
  videoCard: {
    minHeight: 86,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    backgroundColor: COLORS.darkCard,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
  },
  thumbnail: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    color: COLORS.paleGold,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  videoSubtitle: {
    color: '#a89881',
    fontSize: 12,
  },
  stateBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  stateTitle: {
    color: COLORS.paleGold,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  stateText: {
    color: COLORS.mutedGold,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '700',
  },
});