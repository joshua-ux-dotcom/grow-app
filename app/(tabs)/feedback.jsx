import React, { useState } from 'react';
import {
  View,
  Text,
 StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

import InfoCard from '../../components/feedback/InfoCard';
import FeedbackTypeButton from '../../components/feedback/FeedbackTypeButton';
import ImportanceButton from '../../components/feedback/ImportanceButton';
import { supabase } from '../../lib/supabase';

export default function FeedbackScreen() {
  const [selectedType, setSelectedType] = useState('Idee / Vorschlag');
  const [selectedImportance, setSelectedImportance] = useState(4);
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [sending, setSending] = useState(false);

  const feedbackTypes = ['Idee / Vorschlag', 'Bug melden', 'Lob & Dank'];
  const TEST_USER_ID = '06274c6b-c4a4-42c3-871a-c3571aa74865';

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Berechtigung nötig',
          'Bitte erlaube den Zugriff auf deine Fotos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      setSelectedImage({
        uri: asset.uri,
        base64: asset.base64,
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || `feedback-${Date.now()}.jpg`,
      });
    } catch (error) {
      Alert.alert('Fehler', 'Bild konnte nicht ausgewählt werden.');
    }
  };

  const uploadFeedbackImage = async (userId) => {
    if (!selectedImage) return { imageUrl: null, imagePath: null };

    const fileExt = selectedImage.fileName.split('.').pop() || 'jpg';
    const safeUserId = userId || 'anonymous';
    const filePath = `${safeUserId}/${Date.now()}.${fileExt}`;

    const arrayBuffer = decode(selectedImage.base64);

    const { error: uploadError } = await supabase.storage
      .from('feedback-images')
      .upload(filePath, arrayBuffer, {
        contentType: selectedImage.mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('feedback-images')
      .getPublicUrl(filePath);

    return {
      imageUrl: data.publicUrl,
      imagePath: filePath,
    };
  };

  const handleSend = async () => {
    if (!text.trim()) {
      Alert.alert('Hinweis', 'Bitte schreibe zuerst dein Feedback.');
      return;
    }

    try {
      setSending(true);

      const userId = TEST_USER_ID;

      let imageUrl = null;
      let imagePath = null;

      if (selectedImage) {
        const uploadResult = await uploadFeedbackImage(userId);
        imageUrl = uploadResult.imageUrl;
        imagePath = uploadResult.imagePath;
      }

      const { error: feedbackError } = await supabase.from('feedback').insert({
        user_id: userId,
        feedback_type: selectedType,
        importance: selectedImportance,
        message: text.trim(),
        image_url: imageUrl,
        image_path: imagePath,
      });

      if (feedbackError) {
        throw feedbackError;
      }

      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('grow_points')
        .eq('id', userId)
        .single();

      if (profileFetchError) {
        throw profileFetchError;
      }

      const currentGrowPoints = profile?.grow_points ?? 0;

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          grow_points: currentGrowPoints + 5,
        })
        .eq('id', userId);

      if (profileUpdateError) {
        throw profileUpdateError;
      }

      const { error: logError } = await supabase
        .from('grow_points_log')
        .insert({
          user_id: userId,
          points: 5,
          reason: 'feedback_sent',
        });

      if (logError) {
        throw logError;
      }

      setText('');
      setSelectedImage(null);
      setSelectedType('Idee / Vorschlag');
      setSelectedImportance(4);

      Alert.alert(
        'Erfolg',
        'Dein Feedback wurde gespeichert. Du hast 5 Grow Points erhalten.'
      );
    } catch (error) {
      console.log('Fehler beim Senden von Feedback:', error);
      Alert.alert('Fehler', 'Feedback konnte nicht gesendet werden.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.growTitle}>GROW</Text>

        <View style={styles.headerRow}>
          <View style={styles.headerTextWrapper}>
            <Text style={styles.title}>Feedback</Text>
            <Text style={styles.subtitle}>Deine Stimme. Unser Wachstum.</Text>
            <Text style={styles.description}>
              Hilf uns, GROW jeden Tag ein Stück besser zu machen.
            </Text>
          </View>

          <View style={styles.headerIconContainer}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={34}
              color="#D4AF37"
            />
          </View>
        </View>

        <View style={styles.topCardsContainer}>
          <InfoCard
            icon={<Ionicons name="bulb-outline" size={22} color="#D4AF37" />}
            title="Deine Meinung zählt"
            text="Jedes Feedback bringt uns weiter."
          />

          <InfoCard
            icon={<Ionicons name="trending-up-outline" size={22} color="#D4AF37" />}
            title="Gemeinsam wachsen"
            text="Wir hören zu und setzen um."
          />

          <InfoCard
            icon={<Ionicons name="gift-outline" size={22} color="#D4AF37" />}
            title="Belohnt werden"
            text="Gib Feedback & sammle Grow Points."
          />
        </View>

        <Text style={styles.sectionTitle}>WAS MÖCHTEST DU FEEDBACK GEBEN?</Text>

        <View style={styles.feedbackTypeRow}>
          {feedbackTypes.map((type) => (
            <FeedbackTypeButton
              key={type}
              label={type}
              active={selectedType === type}
              onPress={() => setSelectedType(type)}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>WIE KÖNNEN WIR GROW VERBESSERN?</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            multiline
            maxLength={500}
            value={text}
            onChangeText={setText}
            placeholder="Teile deine Idee, dein Feedback oder was dir fehlt. Je mehr Details, desto besser."
            placeholderTextColor="#7E7A88"
          />
          <Text style={styles.counter}>{text.length}/500</Text>
        </View>

        <Text style={styles.sectionTitle}>WIE WICHTIG IST DIR DAS?</Text>
        <Text style={styles.smallDescription}>
          Deine Einschätzung hilft uns zu priorisieren.
        </Text>

        <View style={styles.importanceRow}>
          {[1, 2, 3, 4].map((item) => (
            <ImportanceButton
              key={item}
              value={item}
              active={selectedImportance === item}
              onPress={() => setSelectedImportance(item)}
            />
          ))}
        </View>

        <View style={styles.importanceLabels}>
          <Text style={styles.importanceLabel}>Nicht wichtig</Text>
          <Text style={styles.importanceLabel}>Sehr wichtig</Text>
        </View>

        <Text style={styles.sectionTitle}>SCREENSHOT HINZUFÜGEN (OPTIONAL)</Text>
        <Text style={styles.smallDescription}>
          Ein Bild sagt mehr als 1.000 Worte.
        </Text>

        <TouchableOpacity
          style={styles.uploadBox}
          onPress={handlePickImage}
          activeOpacity={0.85}
        >
          <Feather name="image" size={22} color="#D4AF37" />
          <Text style={styles.uploadTitle}>
            {selectedImage ? 'Bild ändern' : 'Bild hinzufügen'}
          </Text>
          <Text style={styles.uploadSubtext}>PNG, JPG bis 5 MB</Text>
        </TouchableOpacity>

        {selectedImage && (
          <View style={styles.previewWrap}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.previewImage}
            />

            <TouchableOpacity
              onPress={() => setSelectedImage(null)}
              style={styles.removeImageButton}
            >
              <Text style={styles.removeImageText}>Bild entfernen</Text>
            </TouchableOpacity>
          </View>
        )}

       <TouchableOpacity
        style={[styles.sendButton, sending && { opacity: 0.7 }]}
        onPress={handleSend}
        disabled={sending}
      >
        {sending ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.sendButtonText}>Feedback senden</Text>
        )}
      </TouchableOpacity>

        <Text style={styles.footerText}>
          Danke, dass du Grow besser machst. 🙏
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09070D',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  growTitle: {
    textAlign: 'center',
    color: '#D4AF37',
    fontSize: 15,
    letterSpacing: 3,
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 22,
  },
  headerTextWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#D9D4E2',
    fontSize: 14,
    marginBottom: 4,
  },
  description: {
    color: '#8E8998',
    fontSize: 13,
    lineHeight: 18,
  },
  headerIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16101F',
    shadowColor: '#D4AF37',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  topCardsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 26,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 4,
  },
  feedbackTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  inputContainer: {
    backgroundColor: '#130F19',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2D2637',
    minHeight: 150,
    padding: 16,
    marginBottom: 28,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    color: '#6F6A77',
    fontSize: 12,
    marginTop: 10,
  },
  smallDescription: {
    color: '#8E8998',
    fontSize: 12,
    marginBottom: 14,
  },
  importanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  importanceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  importanceLabel: {
    color: '#8E8998',
    fontSize: 11,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#3A3148',
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#110D16',
  },
  imageSection: {
    marginTop: 16,
    marginBottom: 20,
  },

  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#7f6236',
    borderRadius: 12,
    backgroundColor: '#120d19',
  },

  imageButtonText: {
    color: '#f2dfb4',
    fontSize: 14,
    fontWeight: '600',
  },

  previewWrap: {
    marginTop: 12,
  },

  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
  },

  removeImageButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },

  removeImageText: {
    color: '#d6d0db',
    fontSize: 13,
  },

  uploadTitle: {
    color: '#F2D37A',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  uploadSubtext: {
    color: '#7F7989',
    fontSize: 11,
    marginTop: 4,
  },
  sendButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  sendButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    color: '#B6B0C2',
    fontSize: 12,
  },
});