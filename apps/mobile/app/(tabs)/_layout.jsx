import { logger } from '../../lib/logger';
import { Tabs, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, View } from 'react-native';
 
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';
import { s, sv } from '../../constants/layout';

import { getSavedDeepWorkSession } from '../../features/tools/deep-work/services/deepWorkStore';
import { triggerHaptic } from '../../lib/haptics';


const SAMSUNG_LARGE_NAV_INSET_THRESHOLD = 32;
const IS_SAMSUNG_ANDROID =
  Platform.OS === 'android' &&
  String(Platform.constants?.Manufacturer ?? '').toLowerCase() === 'samsung';

function TabIcon({ name, color, size, focused }) {
  return (
    <View
      style={{
        width: s(44),
        height: s(44),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: focused ? COLORS.gold : 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: focused ? 0.9 : 0,
        shadowRadius: focused ? 10 : 0,
        elevation: focused ? 12 : 0,
      }}
    >
      <Ionicons
        name={name}
        size={size}
        color={focused ? COLORS.softGold : color}
      />
      {focused && (
        <View
          style={{
            position: 'absolute',
            bottom: 2,
            width: size < 22 ? 4 : 5,
            height: size < 22 ? 4 : 5,
            borderRadius: 999,
            backgroundColor: COLORS.softGold,
            shadowColor: COLORS.softGold,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 6,
          }}
        />
      )}
    </View>
  );
}
 
function CustomTabButton(props) {
  const handlePress = async (event) => {
    try {
      const session = await getSavedDeepWorkSession();

      if (session?.phase === 'running') {
        return;
      }
    } catch (error) {
      logger.debug('[Tabs] Deep Work session check failed:', error);
    }

    void triggerHaptic('selection');
    props.onPress?.(event);
  };

  return (
    <Pressable
      {...props}
      onPress={handlePress}
      hitSlop={{ top: 0, bottom: 2, left: 20, right: 20 }}
      style={({ pressed }) => [
        typeof props.style === 'function' ? props.style({ pressed }) : props.style,
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: pressed ? 0.78 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
    />
  );
}
 
export default function TabsLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const hasLargeAndroidNavigationInset =
    Platform.OS === 'android' && insets.bottom > SAMSUNG_LARGE_NAV_INSET_THRESHOLD;

  // Preserve the tested Samsung handling while giving other Android devices
  // with a large system-navigation inset only a minimal visual lift.
  const tabBarBottom =
    IS_SAMSUNG_ANDROID && hasLargeAndroidNavigationInset
      ? insets.bottom
      : hasLargeAndroidNavigationInset
        ? sv(6)
        : 1;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'none',
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: COLORS.background },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.goldBorder,
        tabBarStyle: {
          position: 'absolute',
          left: s(16),
          right: s(16),
          bottom: tabBarBottom,
          height: sv(68),
          backgroundColor: COLORS.darkTabBar,
          borderTopWidth: 0,
          borderRadius: s(34),
          paddingTop: sv(10),
          shadowColor: COLORS.black,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 16,
        },
        tabBarButton: (props) => <CustomTabButton {...props} />,
      }}
    >
      <Tabs.Screen
        name="mentor"
        options={{
            href: null,
        }}
      />
      <Tabs.Screen
        name="feedback"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="mail-outline" color={color} size={s(18)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="leaf-outline" color={color} size={s(26)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        listeners={{
          tabPress: (event) => {
            event.preventDefault();

            if (pathname !== '/tools') {
              router.replace('/tools');
            }
          },
        }}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="grid-outline" color={color} size={s(26)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person-circle-outline" color={color} size={s(26)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="saved-feed" options={{ href: null }} />
    </Tabs>
  );
};
