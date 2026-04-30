import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FilePreviewScreen } from '../screens/FilePreviewScreen';
import { FilesScreen } from '../screens/FilesScreen';
import { LocalFilesScreen } from '../screens/LocalFilesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SharesScreen } from '../screens/SharesScreen';
import type { MainTabParamList, RootStackParamList } from './types';
import { AppTheme } from '../ui/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        tabBarActiveTintColor: AppTheme.colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          height: 62,
          paddingTop: 6,
          borderTopColor: AppTheme.colors.border,
          backgroundColor: AppTheme.colors.card,
        },
      }}
    >
      <Tab.Screen name="Cloud" component={FilesScreen} options={{ title: '云盘' }} />
      <Tab.Screen name="Local" component={LocalFilesScreen} options={{ title: '本地' }} />
      <Tab.Screen name="Shares" component={SharesScreen} options={{ title: '分享' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
