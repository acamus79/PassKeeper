import React from 'react';
import { Stack } from "expo-router";
import useTranslation from '../../src/hooks/useTranslation';
import useColorScheme from '../../src/hooks/useColorScheme';
import Colors from '../../src/constants/Colors';

export default function AuthLayout() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? Colors.dark.surface : Colors.light.surface,
        },
        headerTintColor: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="register/index" options={{ title: t('register.title') }} />
      <Stack.Screen name="forgot-password/index" options={{ title: t('forgotPassword.title') }} />
    </Stack>
  );
}