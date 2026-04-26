import { useCallback, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
 
import { COLORS } from '../../../constants/colors';
import { getSavedVideos } from '../../../features/feed/services/videos';
import { s, sv, sf } from '../../../constants/layout';
 
const { width } = Dimensions.get('window');
const GAP = 3;
const HORIZONTAL_PADDING = 18;
const ITEM_WIDTH = (width - HORIZONTAL_PADDING * 2 - GAP * 2) / 3;
const ITEM_HEIGHT = ITEM_WIDTH * 1.55;
 
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
      pathname: '/(tabs)/saved-feed',
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
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Pressable
              style={styles.gridItem}
              onPress={() => openSavedFeed(index)}
            >
              {item.thumbnail ? (
                <Image
                  source={{ uri: item.thumbnail }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.thumbnailFallback}>
                  <Ionicons name="play" size={26} color={COLORS.black} />
                </View>
              )}
 
              <View style={styles.playBadge}>
                <Ionicons name="play" size={14} color={COLORS.paleGold} />
              </View>
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
    paddingTop: sv(66),
    paddingHorizontal: HORIZONTAL_PADDING,
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
    marginRight: s(12),
  },
  topLabel: {
    color: COLORS.dimGold,
    fontSize: sf(10),
    letterSpacing: 2,
    marginBottom: 3,
  },
  title: {
    color: COLORS.paleGold,
    fontSize: sf(24),
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.mutedGold,
    fontSize: sf(13),
    lineHeight: 19,
    marginBottom: 22,
  },
  grid: {
    paddingBottom: 30,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  gridItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    backgroundColor: COLORS.darkCard,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 24,
    height: 24,
    borderRadius: s(12),
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: sv(80),
  },
  stateTitle: {
    color: COLORS.paleGold,
    fontSize: sf(20),
    fontWeight: '700',
    marginTop: 14,
    marginBottom: sv(8),
    textAlign: 'center',
  },
  stateText: {
    color: COLORS.mutedGold,
    fontSize: sf(14),
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: sv(20),
    backgroundColor: COLORS.gold,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: s(12),
  },
  retryButtonText: {
    color: COLORS.black,
    fontSize: sf(14),
    fontWeight: '700',
  },
});