import { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator } from 'react-native';

import { COLORS } from '../../../../constants/colors';
import PressableScale from '../../../../components/ui/PressableScale';
import { sv } from '../../../../constants/layout';
import { styles } from '../styles/leitfragenStyles';

const LEITFRAGEN_INPUT_MIN_HEIGHT = sv(120);
const LEITFRAGEN_INPUT_HEIGHT_BUFFER = sv(2);

export default function LeitfragenQuestionPage({
  questionPage,
  answer,
  onChangeAnswer,
  inputGestureProps,
  onTextInputTouchEnd,
  formError,
  canSave,
  saving,
  onSave,
}) {
  const prompts = questionPage?.prompts ?? [];
  const exampleAnswer = questionPage?.exampleAnswer?.trim();
  const [inputHeight, setInputHeight] = useState(LEITFRAGEN_INPUT_MIN_HEIGHT);


  const handleContentSizeChange = (event) => {
    const contentHeight = event?.nativeEvent?.contentSize?.height ?? 0;
    if (!Number.isFinite(contentHeight) || contentHeight <= 0) return;

    const nextHeight = Math.max(
      LEITFRAGEN_INPUT_MIN_HEIGHT,
      Math.ceil(contentHeight) + LEITFRAGEN_INPUT_HEIGHT_BUFFER,
    );

    setInputHeight((currentHeight) => {
      if (Math.abs(currentHeight - nextHeight) < 2) return currentHeight;
      return nextHeight;
    });
  };

  return (
    <View style={styles.bookPageCard}>
      <Text style={styles.leitfragenQuestionTitle}>{questionPage?.title}</Text>

      {prompts.length > 0 && (
        <View style={styles.promptCard}>
          <Text style={styles.promptTitle}>Erklärung</Text>
          {prompts.map((prompt, index) => (
            <View key={`${questionPage?.key}-prompt-${index}`} style={styles.promptRow}>
              <Text style={styles.promptBullet}>•</Text>
              <Text style={styles.promptText}>{prompt}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.answerLabel}>Deine Antwort</Text>
      <TextInput
        value={answer}
        onChangeText={onChangeAnswer}
        onContentSizeChange={handleContentSizeChange}
        placeholder={questionPage?.placeholder}
        placeholderTextColor={COLORS.textFaint}
        multiline
        scrollEnabled={false}
        {...inputGestureProps}
        onTouchEnd={(event) => onTextInputTouchEnd(event, false)}
        style={[styles.input, styles.leitfragenInput, { height: inputHeight }]}
      />

      {exampleAnswer ? (
        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>Beispiel-Antwort</Text>
          <Text style={styles.exampleText}>{exampleAnswer}</Text>
        </View>
      ) : null}

      {formError && <Text style={styles.errorText}>{formError}</Text>}

      <PressableScale
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        onPress={onSave}
        disabled={!canSave}
      >
        {saving ? (
          <ActivityIndicator color={COLORS.gold} />
        ) : (
          <Text style={styles.saveText}>Antwort speichern</Text>
        )}
      </PressableScale>
    </View>
  );
}
