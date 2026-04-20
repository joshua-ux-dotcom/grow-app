import { Pressable, StyleSheet, Text } from 'react-native';

export default function AppButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#b78a3b',
    backgroundColor: '#151018',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.65,
  },
  text: {
    color: '#f3d58b',
    fontSize: 13,
    fontWeight: '700',
  },
});