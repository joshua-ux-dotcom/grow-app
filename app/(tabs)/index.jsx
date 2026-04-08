// app/(tabs)/index.jsx

import { FlatList, StyleSheet, View, Dimensions } from 'react-native';
import VideoOverlay from '../../components/ui/VideoOverlay';

const { height, width } = Dimensions.get('window');

const feedData = [
  { id: '1' },
  { id: '2' },
  { id: '3' },
  { id: '4' },
];

export default function FeedScreen() {
  return (
    <FlatList
      data={feedData}
      keyExtractor={(item) => item.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={height}
      decelerationRate="fast"
      renderItem={() => (
        <View style={styles.page}>
          <View style={styles.background} />
          <View style={styles.overlayDark} />
          <VideoOverlay />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    width,
    height,
    backgroundColor: '#050505',
  },

  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#0A0A0A',
  },

  overlayDark: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
});