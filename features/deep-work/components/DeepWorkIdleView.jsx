import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../constants/colors';
import { s } from '../../../constants/layout';
import { styles } from '../styles/deepWorkStyles';

export default function DeepWorkIdleView({ router, openSetup }) {
  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable 
            onPress={() => {
                if (phase !== 'running') {
                  router.back();
                }
            }}  
            style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={s(24)} color={COLORS.softGold} />
          <Text style={styles.backText}>Tools</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.idleContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="hourglass-outline" size={s(36)} color={COLORS.gold} />
          </View>
          <Text style={styles.title}>DEEP WORK</Text>
          <Text style={styles.subtitle}>Disziplin. Fokus. Keine Ablenkung.</Text>
        </View>

        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={s(18)}
            color={COLORS.gold}
          />
          <Text style={styles.infoText}>
            Starte eine fokussierte Arbeitseinheit ohne Unterbrechungen.
          </Text>
        </View>

        <Pressable style={styles.startButton} onPress={openSetup}>
          <Ionicons name="play" size={s(20)} color={COLORS.black} />
          <Text style={styles.startButtonText}>Session starten</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}