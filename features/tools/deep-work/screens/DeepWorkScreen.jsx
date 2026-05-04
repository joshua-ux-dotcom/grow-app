import { BackHandler } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

import { useDeepWorkSession } from '../hooks/useDeepWorkSession';
import DeepWorkIdleView from '../components/DeepWorkIdleView';
import DeepWorkSessionView from '../components/DeepWorkSessionView';
import DeepWorkSetupModal from '../components/DeepWorkSetupModal';
import { DeepWorkDoneModal } from '../components/DeepWorkDoneModal';

export default function DeepWorkScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const session = useDeepWorkSession();

  const {
    phase,
    setupVisible,
    doneVisible,
    closeDone,
    totalMinutes,
  } = session;

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => phase === 'running';

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [phase])
  );

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (!parent) return;

      const unsubscribe = parent.addListener('tabPress', (e) => {
        if (phase === 'running') {
          e.preventDefault();
        }
      });

      return unsubscribe;
    }, [navigation, phase])
  );

  if (phase === 'idle') {
    return (
      <>
        <Stack.Screen options={{ gestureEnabled: true }} />

        <DeepWorkIdleView router={router} openSetup={session.openSetup} />

        <DeepWorkSetupModal
          visible={setupVisible}
          closeSetup={session.closeSetup}
          inputTask={session.inputTask}
          setInputTask={session.setInputTask}
          selCategory={session.selCategory}
          setSelCategory={session.setSelCategory}
          customCategory={session.customCategory}
          setCustomCategory={session.setCustomCategory}
          setSelHours={session.setSelHours}
          setSelMinutes={session.setSelMinutes}
          canStart={session.canStart}
          startSession={session.startSession}
        />

        <DeepWorkDoneModal
          visible={doneVisible}
          onClose={closeDone}
          totalMinutes={totalMinutes}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: phase !== 'running' }} />

      <DeepWorkSessionView
        router={router}
        phase={phase}
        taskName={session.taskName}
        category={session.category}
        remaining={session.remaining}
        progress={session.progress}
        pulseAnim={session.pulseAnim}
        togglePause={session.togglePause}
        endSession={session.endSession}
      />
    </>
  );
}