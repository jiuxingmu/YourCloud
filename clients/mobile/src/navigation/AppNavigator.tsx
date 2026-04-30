import { Feather } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { FilePreviewScreen } from '../screens/FilePreviewScreen';
import { FilesScreen } from '../screens/FilesScreen';
import { LocalFilesScreen } from '../screens/LocalFilesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ShareAccessScreen } from '../screens/ShareAccessScreen';
import { SharesScreen } from '../screens/SharesScreen';
import type { MainTabParamList, RootStackParamList } from './types';
import { AppTheme } from '../ui/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ focused, name }: { focused: boolean; name: keyof typeof Feather.glyphMap }) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.95)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1 : 0.95,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();
  }, [focused, scale]);

  return (
    <Animated.View style={[styles.tabIconWrap, { transform: [{ scale }] }]}>
      {focused ? <View style={styles.tabTopIndicator} /> : null}
      <View style={[styles.tabBubble, focused && styles.tabBubbleActive]}>
        <Feather name={name} size={18} color={focused ? AppTheme.colors.primary : '#94A3B8'} />
      </View>
    </Animated.View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppTheme.colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          height: 66,
          paddingTop: 6,
          paddingBottom: 8,
          borderTopColor: AppTheme.colors.border,
          backgroundColor: AppTheme.colors.card,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Cloud"
        component={FilesScreen}
        options={{ title: '云盘', tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="cloud" /> }}
      />
      <Tab.Screen
        name="Local"
        component={LocalFilesScreen}
        options={{ title: '本地', tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="hard-drive" /> }}
      />
      <Tab.Screen
        name="Shares"
        component={SharesScreen}
        options={{ title: '分享', tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="share-2" /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: '我的', tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="user" /> }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="FilePreview"
          component={FilePreviewScreen}
          options={{ title: '预览', presentation: 'modal', headerShown: true }}
        />
        <Stack.Screen name="ShareAccess" component={ShareAccessScreen} options={{ title: '访问分享', headerShown: true }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    width: 44,
    height: 30,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tabTopIndicator: {
    position: 'absolute',
    top: 0,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: AppTheme.colors.primary,
  },
  tabBubble: {
    width: 32,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBubbleActive: {
    backgroundColor: '#E8F0FF',
  },
});
