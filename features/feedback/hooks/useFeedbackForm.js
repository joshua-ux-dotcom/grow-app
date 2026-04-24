import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { sendFeedback } from '../services/feedbackService';
import { supabase } from '../../../services/supabaseClient';

const DEFAULT_TYPE = 'Idee / Vorschlag';
const DEFAULT_IMPORTANCE = 4;

export function useFeedbackForm() {
  const [selectedType, setSelectedType] = useState(DEFAULT_TYPE);
  const [selectedImportance, setSelectedImportance] = useState(DEFAULT_IMPORTANCE);
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  const clearStatus = () => {
    setSendError(null);
    setSendSuccess(false);
  };

  const resetForm = () => {
    setText('');
    setSelectedImage(null);
    setSelectedType(DEFAULT_TYPE);
    setSelectedImportance(DEFAULT_IMPORTANCE);
  };

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

      clearStatus();
    } catch {
      Alert.alert('Fehler', 'Bild konnte nicht ausgewählt werden.');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    clearStatus();
  };

  const handleSend = async () => {
    if (!text.trim()) {
      Alert.alert('Hinweis', 'Bitte schreibe zuerst dein Feedback.');
      return;
    }

    try {
      setSending(true);
      clearStatus();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Kein User eingeloggt');
    }

    await sendFeedback({
      userId: user.id,
    })
      resetForm();
      setSendSuccess(true);
    } catch (error) {
      console.log('Fehler beim Senden von Feedback:', error);
      setSendError('Feedback konnte nicht gesendet werden. Bitte versuche es erneut.');
    } finally {
      setSending(false);
    }
  };

  return {
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
  };
}