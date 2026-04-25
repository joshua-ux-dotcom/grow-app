import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { COLORS } from '../../constants/colors';

function TabIcon({ name, color, size, focused }) {
  return (
    <View
      style={{
        width: 44,
        height: 44,
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
  return (
    <Pressable
      {...props}
      hitSlop={{ top: 0, bottom: 2, left: 20, right: 20 }}
      style={[props.style, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.goldBorder,

        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 1,
          height: 68,
          backgroundColor: COLORS.darkTabBar,
          borderTopWidth: 0,
          borderRadius: 34,
          paddingTop: 10,
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
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="chatbubble-ellipses-outline" color={color} size={18} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="leaf-outline" color={color} size={26} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="tools"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="grid-outline" color={color} size={26} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="feedback"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="mail-outline" color={color} size={18} focused={focused} />
          ),
        }}
      />

      {/* Stack-Screen innerhalb der Tab-Gruppe — kein Tab-Eintrag */}
      <Tabs.Screen
        name="saved-feed"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
