import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';

import { COLORS } from '../../../../constants/colors';
import { styles } from '../styles/deepWorkStyles';
import {
  HOURS,
  MINUTES,
  EXAMPLE_CATEGORIES,
  DEFAULT_SESSION_MINUTES,
} from '../utils/deepWorkUtils';
import { PickerColumn } from './PickerColumn';

export default function DeepWorkSetupModal({
  visible,
  closeSetup,
  inputTask,
  setInputTask,
  selCategory,
  setSelCategory,
  customCategory,
  setCustomCategory,
  setSelHours,
  setSelMinutes,
  canStart,
  startSession,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={closeSetup}
    >
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSetup} />

        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.sheetScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Neue Session</Text>

            <Text style={styles.label}>AUFGABE</Text>
            <TextInput
              style={styles.input}
              placeholder="Was willst du erreichen?"
              placeholderTextColor={COLORS.textDim}
              value={inputTask}
              onChangeText={setInputTask}
              returnKeyType="done"
            />

            <Text style={styles.label}>DAUER</Text>
            <View style={styles.pickerContainer}>
              <PickerColumn
                data={HOURS}
                initialIndex={0}
                onChange={setSelHours}
              />
              <Text style={styles.pickerSeparator}>h</Text>
              <PickerColumn
                data={MINUTES}
                initialIndex={DEFAULT_SESSION_MINUTES}
                onChange={setSelMinutes}
              />
              <Text style={styles.pickerSeparator}>min</Text>
            </View>

            <Text style={styles.label}>KATEGORIE</Text>
            <View style={styles.chipRow}>
              {EXAMPLE_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.chip,
                    selCategory === cat && !customCategory && styles.chipActive,
                  ]}
                  onPress={() => {
                    setSelCategory(cat);
                    setCustomCategory('');
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selCategory === cat &&
                        !customCategory &&
                        styles.chipTextActive,
                    ]}
                  >
                    {cat.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Eigene Kategorie (optional)"
              placeholderTextColor={COLORS.textDim}
              value={customCategory}
              onChangeText={(text) => {
                setCustomCategory(text);
                if (text) setSelCategory('');
              }}
              returnKeyType="done"
            />

            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelBtn} onPress={closeSetup}>
                <Text style={styles.cancelBtnText}>Abbrechen</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.confirmBtn,
                  !canStart && styles.confirmBtnDisabled,
                ]}
                onPress={startSession}
                disabled={!canStart}
              >
                <Text style={styles.confirmBtnText}>Starten</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}