import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Shield, 
  Palette, 
  Download, 
  Cloud, 
  Info, 
  FileText, 
  ChevronRight,
  Moon,
  Sun,
  Fingerprint,
  LogOut,
  AlertCircle
} from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { useColorScheme } from '@/lib/useColorScheme';
import { useUserName } from '@/shared/hooks/useUserName';

// Enable className styling for icons
cssInterop(Shield, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Palette, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Download, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Cloud, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Info, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(FileText, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(ChevronRight, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Moon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Sun, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Fingerprint, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(LogOut, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(AlertCircle, { className: { target: 'style', nativeStyleToProp: { color: true } } });

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { displayName } = useUserName();
  
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  const handleBiometricToggle = () => {
    setBiometricEnabled(!biometricEnabled);
    if (!biometricEnabled) {
      Alert.alert(
        'Biometric Authentication',
        'Face ID / Touch ID has been enabled for secure access.'
      );
    }
  };

  const handleDataExport = () => {
    Alert.alert(
      'Export Data',
      'Choose export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'JSON', onPress: () => Alert.alert('Export', 'Data exported as JSON file.') },
        { text: 'PDF', onPress: () => Alert.alert('Export', 'Data exported as PDF document.') },
      ]
    );
  };

  const handleICloudRestore = () => {
    Alert.alert(
      'iCloud Restore',
      'Your data is automatically backed up to iCloud through your device backup. To restore:\n\n1. Go to Settings > Your Name > iCloud > iCloud Backup\n2. Ensure "LifeVault" is included in backups\n3. Restore from backup when setting up a new device',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://example.com/privacy');
  };

  const handleAbout = () => {
    Alert.alert(
      'About LifeVault',
      'Version 1.0.0\n\nLifeVault helps you organize and securely store important information for you, your family, and your pets.\n\nAll data is stored locally on your device and protected by biometric authentication.',
      [{ text: 'Close', style: 'default' }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your data will remain on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => Alert.alert('Signed Out', 'You have been signed out successfully.') },
      ]
    );
  };

  // Custom Toggle Component
  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <TouchableOpacity
      onPress={onToggle}
      className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ${
        enabled ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <View
        className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-foreground">
          {displayName ? `${displayName}'s Settings` : "Settings"}
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Section */}
        <View>
          <Text className="text-sm font-semibold text-muted-foreground mb-3 px-2">SECURITY</Text>
          <View className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Face ID / Touch ID */}
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center">
                  <Fingerprint className="text-primary" size={20} />
                </View>
                <View>
                  <Text className="text-foreground font-medium">Face ID / Touch ID</Text>
                  <Text className="text-muted-foreground text-xs mt-0.5">
                    Require biometric to open app
                  </Text>
                </View>
              </View>
              <Toggle enabled={biometricEnabled} onToggle={handleBiometricToggle} />
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View>
          <Text className="text-sm font-semibold text-muted-foreground mb-3 px-2">APPEARANCE</Text>
          <View className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Theme Toggle */}
            <TouchableOpacity 
              onPress={() => setColorScheme(isDark ? 'light' : 'dark')}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-purple-500/10 rounded-xl items-center justify-center">
                  {isDark ? (
                    <Moon className="text-purple-500" size={20} />
                  ) : (
                    <Sun className="text-purple-500" size={20} />
                  )}
                </View>
                <View>
                  <Text className="text-foreground font-medium">Theme</Text>
                  <Text className="text-muted-foreground text-xs mt-0.5 capitalize">
                    {colorScheme} mode
                  </Text>
                </View>
              </View>
              <ChevronRight className="text-muted-foreground" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Section */}
        <View>
          <Text className="text-sm font-semibold text-muted-foreground mb-3 px-2">DATA & BACKUP</Text>
          <View className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Export Data */}
            <TouchableOpacity 
              onPress={handleDataExport}
              className="flex-row items-center justify-between p-4 border-b border-border active:bg-muted/50"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-blue-500/10 rounded-xl items-center justify-center">
                  <Download className="text-blue-500" size={20} />
                </View>
                <View>
                  <Text className="text-foreground font-medium">Export Data</Text>
                  <Text className="text-muted-foreground text-xs mt-0.5">
                    Download all your data
                  </Text>
                </View>
              </View>
              <ChevronRight className="text-muted-foreground" size={20} />
            </TouchableOpacity>

            {/* iCloud Restore */}
            <TouchableOpacity 
              onPress={handleICloudRestore}
              className="flex-row items-center justify-between p-4 active:bg-muted/50"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-sky-500/10 rounded-xl items-center justify-center">
                  <Cloud className="text-sky-500" size={20} />
                </View>
                <View>
                  <Text className="text-foreground font-medium">iCloud Restore</Text>
                  <Text className="text-muted-foreground text-xs mt-0.5">
                    Restore from device backup
                  </Text>
                </View>
              </View>
              <ChevronRight className="text-muted-foreground" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View>
          <Text className="text-sm font-semibold text-muted-foreground mb-3 px-2">ABOUT</Text>
          <View className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* About */}
            <TouchableOpacity 
              onPress={handleAbout}
              className="flex-row items-center justify-between p-4 border-b border-border active:bg-muted/50"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-emerald-500/10 rounded-xl items-center justify-center">
                  <Info className="text-emerald-500" size={20} />
                </View>
                <View>
                  <Text className="text-foreground font-medium">About LifeVault</Text>
                  <Text className="text-muted-foreground text-xs mt-0.5">
                    Version 1.0.0
                  </Text>
                </View>
              </View>
              <ChevronRight className="text-muted-foreground" size={20} />
            </TouchableOpacity>

            {/* Privacy Policy */}
            <TouchableOpacity 
              onPress={handlePrivacyPolicy}
              className="flex-row items-center justify-between p-4 active:bg-muted/50"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-amber-500/10 rounded-xl items-center justify-center">
                  <FileText className="text-amber-500" size={20} />
                </View>
                <View>
                  <Text className="text-foreground font-medium">Privacy Policy</Text>
                  <Text className="text-muted-foreground text-xs mt-0.5">
                    How we handle your data
                  </Text>
                </View>
              </View>
              <ChevronRight className="text-muted-foreground" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Card */}
        <View className="bg-muted/50 rounded-2xl p-4 border border-border">
          <View className="flex-row items-start gap-3">
            <AlertCircle className="text-primary mt-0.5" size={18} />
            <View className="flex-1">
              <Text className="text-foreground font-medium text-sm mb-1">Data Privacy</Text>
              <Text className="text-muted-foreground text-xs leading-relaxed">
                All your data is stored locally on this device and protected by Face ID / Touch ID. 
                We never collect or sell your personal information.
              </Text>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          onPress={handleLogout}
          className="bg-destructive/10 rounded-2xl p-4 border border-destructive/20 flex-row items-center justify-center gap-3 active:bg-destructive/20"
        >
          <LogOut className="text-destructive" size={20} />
          <Text className="text-destructive font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
