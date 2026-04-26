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
import { COLORS } from '../../constants/colors';
import { s, sv, sf } from '../../constants/layout';
 
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
              color={COLORS.gold}
            />
          </View>
        </View>
 
        <View style={styles.topCardsContainer}>
          <InfoCard
            icon={<Ionicons name="bulb-outline" size={22} color={COLORS.gold} />}
            title="Deine Meinung zählt"
            text="Jedes Feedback bringt uns weiter."
          />
          <InfoCard
            icon={<Ionicons name="trending-up-outline" size={22} color={COLORS.gold} />}
            title="Gemeinsam wachsen"
            text="Wir hören zu und setzen um."
          />
          <InfoCard
            icon={<Ionicons name="gift-outline" size={22} color={COLORS.gold} />}
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
            placeholderTextColor={COLORS.textDim}
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
          <Feather name="image" size={22} color={COLORS.gold} />
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
              <ActivityIndicator color={COLORS.black} />
              <Text style={styles.sendButtonText}>Wird gesendet...</Text>
            </>
          ) : (
            <>
              <Text style={styles.sendButtonText}>Feedback senden</Text>
              <Ionicons name="paper-plane-outline" size={18} color={COLORS.nearBlack} />
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
    backgroundColor: COLORS.backgroundDeep,
  },
  content: {
    paddingHorizontal: s(20),
    paddingTop: 18,
    paddingBottom: 40,
  },
  growTitle: {
    textAlign: 'center',
    color: COLORS.gold,
    fontSize: sf(15),
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
    color: COLORS.white,
    fontSize: 34,
    fontWeight: '700',
    marginBottom: sv(4),
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: sf(14),
    marginBottom: sv(4),
  },
  description: {
    color: COLORS.textDim,
    fontSize: sf(13),
    lineHeight: 18,
  },
  headerIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkCard3,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  topCardsContainer: {
    flexDirection: 'row',
    gap: s(10),
    marginBottom: 26,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: sf(13),
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: sv(12),
    marginTop: sv(4),
  },
  feedbackTypeRow: {
    flexDirection: 'row',
    gap: s(10),
    marginBottom: 28,
  },
  inputContainer: {
    backgroundColor: COLORS.darkCard3,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    minHeight: 150,
    padding: 16,
    marginBottom: 28,
  },
  input: {
    color: COLORS.white,
    fontSize: sf(14),
    minHeight: 90,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    color: COLORS.textFaint,
    fontSize: sf(12),
    marginTop: sv(10),
  },
  smallDescription: {
    color: COLORS.textDim,
    fontSize: sf(12),
    marginBottom: sv(14),
  },
  importanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: sv(10),
  },
  importanceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  importanceLabel: {
    color: COLORS.textDim,
    fontSize: sf(11),
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.borderMid,
    borderRadius: s(16),
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: COLORS.darkCard3,
  },
  previewWrap: {
    marginTop: sv(12),
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: s(14),
  },
  removeImageButton: {
    marginTop: sv(10),
    alignSelf: 'flex-start',
  },
  removeImageText: {
    color: COLORS.textSecondary,
    fontSize: sf(13),
  },
  uploadTitle: {
    color: COLORS.lightGold,
    fontSize: sf(14),
    fontWeight: '600',
    marginTop: sv(8),
  },
  uploadSubtext: {
    color: COLORS.textDim,
    fontSize: sf(11),
    marginTop: sv(4),
  },
  sendButton: {
    backgroundColor: COLORS.gold,
    borderRadius: s(16),
    paddingVertical: sv(16),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: s(8),
    marginBottom: 18,
  },
  sendButtonText: {
    color: COLORS.nearBlack,
    fontSize: sf(16),
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: sf(12),
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  successText: {
    textAlign: 'center',
    color: COLORS.gold,
    fontSize: sf(13),
    lineHeight: 18,
    marginBottom: sv(14),
  },
  errorText: {
    textAlign: 'center',
    color: COLORS.error,
    fontSize: sf(13),
    lineHeight: 18,
    marginBottom: sv(14),
  },
});