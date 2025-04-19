import React, { useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { ThemedView } from '../../../src/components/ui/ThemedView';
import { ThemedText } from '../../../src/components/ui/ThemedText';
import useThemeColor from '../../../src/hooks/useThemeColor';
import useTranslation from '../../../src/hooks/useTranslation';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const tintColor = useThemeColor({}, 'tint');
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    // Implementar lógica de recuperación de contraseña
    alert('Se ha enviado un correo de recuperación');
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ThemedText style={styles.title}>
          {t('forgotPassword.title')}
        </ThemedText>

        <ThemedText style={styles.description}>
          {t('forgotPassword.description')}
        </ThemedText>

        <TextInput
          label={t('login.email')}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          mode="outlined"
          autoCapitalize="none"
          keyboardType="email-address"
          theme={{ colors: { primary: tintColor } }}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          buttonColor={tintColor}
        >
          {t('forgotPassword.submitButton')}
        </Button>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
});
