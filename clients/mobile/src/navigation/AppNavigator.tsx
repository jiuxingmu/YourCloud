import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FilePreviewScreen } from '../screens/FilePreviewScreen';
import { FilesScreen } from '../screens/FilesScreen';
import { SharesScreen } from '../screens/SharesScreen';
import type { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Tab.Screen name="Files" component={FilesScreen} options={{ title: '文件' }} />
      <Tab.Screen name="Shares" component={SharesScreen} options={{ title: '分享' }} />
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
