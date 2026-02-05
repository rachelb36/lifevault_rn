import { Tabs } from 'expo-router';
import { Home, Users, BookOpen, FileText, Settings } from 'lucide-react-native';
import { cssInterop, useColorScheme } from 'nativewind';

// Enable className styling for icons
cssInterop(Home, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Users, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(BookOpen, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(FileText, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Settings, { className: { target: 'style', nativeStyleToProp: { color: true } } });

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#0f1a17' : '#f0fdfa',
          borderTopColor: isDark ? '#1a2f29' : '#ccfbf1',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: isDark ? '#14b8a6' : '#0d9488',
        tabBarInactiveTintColor: isDark ? '#5a7268' : '#6b7280',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <Home size={24} color={focused ? (isDark ? '#14b8a6' : '#0d9488') : (isDark ? '#5a7268' : '#6b7280')} />
          ),
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: 'People & Pets',
          tabBarIcon: ({ focused }) => (
            <Users size={24} color={focused ? (isDark ? '#14b8a6' : '#0d9488') : (isDark ? '#5a7268' : '#6b7280')} />
          ),
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          title: 'Directory',
          tabBarIcon: ({ focused }) => (
            <BookOpen size={24} color={focused ? (isDark ? '#14b8a6' : '#0d9488') : (isDark ? '#5a7268' : '#6b7280')} />
          ),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ focused }) => (
            <FileText size={24} color={focused ? (isDark ? '#14b8a6' : '#0d9488') : (isDark ? '#5a7268' : '#6b7280')} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <Settings size={24} color={focused ? (isDark ? '#14b8a6' : '#0d9488') : (isDark ? '#5a7268' : '#6b7280')} />
          ),
        }}
      />
    </Tabs>
  );
}