import { Dimensions, Platform } from 'react-native';
 
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
 
// Basis-Design auf iPhone 14 (390 x 844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
 
// Skalierungsfaktoren — geclampt damit extreme Geräte nicht kaputt gehen
const scaleByWidth = Math.min(Math.max(SCREEN_WIDTH / BASE_WIDTH, 0.8), 1.15);
const scaleByHeight = Math.min(Math.max(SCREEN_HEIGHT / BASE_HEIGHT, 0.8), 1.15);
 
// s()  → für horizontale Werte: padding, margin, Breiten, Icon-Größen
// sv() → für vertikale Werte: paddingTop, height, Abstände
// sf() → für Schriftgrößen (sanfter skaliert)
export function s(size) {
  return Math.round(size * scaleByWidth);
}
 
export function sv(size) {
  return Math.round(size * scaleByHeight);
}
 
export function sf(size) {
  // Schriftgröße skaliert weniger aggressiv als Layout
  const fontScale = Math.min(Math.max(SCREEN_WIDTH / BASE_WIDTH, 0.85), 1.1);
  return Math.round(size * fontScale * 10) / 10;
}
 
export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_HEIGHT < 700,   // iPhone SE
  isMedium: SCREEN_HEIGHT >= 700 && SCREEN_HEIGHT < 844, // iPhone 12 mini, kleine Androids
  isLarge: SCREEN_HEIGHT >= 844,  // iPhone 14+, große Androids
  isTablet: SCREEN_WIDTH >= 768,
  isAndroid: Platform.OS === 'android',
  isIOS: Platform.OS === 'ios',
};