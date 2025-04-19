import React from 'react';
import { Stack } from "expo-router";
import { View, StyleSheet } from 'react-native';
import useTranslation from '../../src/hooks/useTranslation';
import useColorScheme from '../../src/hooks/useColorScheme';
import Colors from '../../src/constants/Colors';
import BottomMenu from '../../src/components/navigation/BottomMenu';
import useBiometrics from '../../src/hooks/useBiometrics';

export default function AppLayout() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { checkBiometricAvailability } = useBiometrics();

  // Verificar disponibilidad biométrica
  React.useEffect(() => {
    checkBiometricAvailability();
  }, []);

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? Colors.dark.surface : Colors.light.surface,
          },
          headerTintColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
        }}
      >
        <Stack.Screen name="passwords/index" options={{ title: t('passwords.title') }} />
        <Stack.Screen name="categories/index" options={{ title: t('categories.title') }} />
        <Stack.Screen name="settings/index" options={{ title: t('settings.title') }} />
      </Stack>
      <BottomMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});