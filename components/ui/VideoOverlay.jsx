// components/ui/VideoOverlay.jsx

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function VideoOverlay() {
  const [saved, setSaved] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>GROW</Text>

        <View style={styles.rightSide}>
            <TouchableOpacity style={styles.circle}>
                <View style={styles.innerCircle} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.circle}>
                <View style={styles.innerCircle} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.circle}>
                <View style={styles.innerCircle} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.circle}>
                <View style={styles.innerCircle} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.saveButton}
                onPress={() => setSaved(!saved)}
                >
                {saved ? (
                    <Ionicons name="bookmark" size={32} color="#D4AF37" />
                ) : (
                    <Feather name="bookmark" size={30} color="#D4AF37" />
                )}
            </TouchableOpacity>
       </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  logo: {
    position: 'absolute',
    top: 58,
    alignSelf: 'center',
    color: '#D4AF37',
    fontSize: 17,
    letterSpacing: 4,
    fontWeight: '600',
    fontFamily: undefined,
    textShadowColor: 'rgba(212,175,55,0.35)',
    textShadowOffset: {
      width: 0,
      height: 0,
    },
    textShadowRadius: 8,
  },

  rightSide: {
    position: 'absolute',
    right: 22,
    top: height * 0.38,
    alignItems: 'center',
  },

  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.7,
    borderColor: '#D4AF37',
    marginBottom: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  innerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },

  saveButton: {
    marginTop: 20,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
});