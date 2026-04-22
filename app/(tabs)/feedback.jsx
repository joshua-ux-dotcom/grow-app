import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';

import InfoCard from '../../features/feedback/components/InfoCard';
import FeedbackTypeButton from '../../features/feedback/components/FeedbackTypeButton';
import ImportanceButton from '../../features/feedback/components/ImportanceButton';
import { useFeedbackForm } from '../../features/feedback/hooks/useFeedbackForm';

const feedbackTypes = ['Idee / Vorschlag', 'Bug melden', 'Lob & Dank'];

export default function FeedbackScreen() {
  const {
    selectedType,
    setSelectedType,
    selectedImportance,
    setSelectedImportance,
    text,
    setText,
    selectedImage,
    sending,
    sendError,
    sendSuccess,
    handlePickImage,
    handleRemoveImage,
    handleSend,
    clearStatus,
  } = useFeedbackForm();

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
              onPress={() => {
                setSelectedType(type);
                clearStatus();
              }}
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
            onChangeText={(value) => {
              setText(value);
              clearStatus();
            }}
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
              onPress={() => {
                setSelectedImportance(item);
                clearStatus();
              }}
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
              onPress={handleRemoveImage}
              style={styles.removeImageButton}
            >
              <Text style={styles.removeImageText}>Bild entfernen</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sending}
        >
          {sending ? (
            <>
              <ActivityIndicator color="#000" />
              <Text style={styles.sendButtonText}>Wird gesendet...</Text>
            </>
          ) : (
            <>
              <Text style={styles.sendButtonText}>Feedback senden</Text>
              <Ionicons name="paper-plane-outline" size={18} color="#111111" />
            </>
          )}
        </TouchableOpacity>

        {sendSuccess && (
          <Text style={styles.successText}>
            Dein Feedback wurde gespeichert. Du hast 5 Grow Points erhalten.
          </Text>
        )}

        {sendError && <Text style={styles.errorText}>{sendError}</Text>}

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
  sendButtonDisabled: {
    opacity: 0.7,
  },
  successText: {
    textAlign: 'center',
    color: '#D4AF37',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  errorText: {
    textAlign: 'center',
    color: '#d46a6a',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
});