import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemedView } from '../../src/components/ui/ThemedView';
import { ThemedText } from '../../src/components/ui/ThemedText';
import useColorScheme from '../../src/hooks/useColorScheme';
import useThemeColor from '../../src/hooks/useThemeColor';
import useBiometrics from '../../src/hooks/useBiometrics';
import useTranslation from '../../src/hooks/useTranslation';
import { useAuth } from '../../src/contexts/AuthContext';

export default function Index() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  // Usar el contexto de autenticación en lugar del servicio directamente
  const { isAuthenticated, loading: isAuthLoading, login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const { isAvailable, isChecking, authenticate, checkBiometricAvailability } = useBiometrics();

  // Verificar si hay una sesión activa al cargar el componente
  useEffect(() => {
    // Verificar disponibilidad biométrica
    checkBiometricAvailability();

    // La redirección se maneja automáticamente cuando isAuthenticated cambia
    if (isAuthenticated) {
      router.replace('/passwords');
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(
        t('login.validationError'),
        t('login.emptyFields')
      );
      return;
    }

    setIsLoading(true);
    try {
      // Usar el método login del contexto
      const success = await login(username, password);
      if (success) {
        // La redirección se manejará en el useEffect cuando isAuthenticated cambie
      } else {
        Alert.alert(
          t('login.authError'),
          t('login.invalidCredentials')
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        t('common.error'),
        t('login.loginFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!isAvailable) {
      console.log('Biometrics not available for login');
      return;
    }

    console.log('Attempting biometric login');
    const success = await authenticate(t('login.biometricPrompt'));
    if (success) {
      // Aquí deberíamos verificar si hay credenciales guardadas para biometría
      // Por ahora, simplemente mostramos un mensaje
      Alert.alert(
        t('login.biometricSuccess'),
        t('login.biometricNotConfigured')
      );
    } else {
      console.log('Biometric authentication failed');
    }
  };

  // Mostrar indicador de carga mientras se verifica la sesión
  if (isAuthLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ThemedView style={styles.logoContainer}>
          <ThemedText style={[styles.title, { color: tintColor }]}>
            {t('common.appName')}
          </ThemedText>
          <Image
            source={require('../../assets/images/react-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </ThemedView>

        <ThemedView style={styles.formContainer}>
          <TextInput
            label={t('login.username')}
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            mode="outlined"
            autoCapitalize="none"
            theme={{ colors: { primary: tintColor } }}
          />

          <TextInput
            label={t('login.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            style={styles.input}
            mode="outlined"
            theme={{ colors: { primary: tintColor } }}
            right={
              <TextInput.Icon
                icon={secureTextEntry ? "eye" : "eye-off"}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              />
            }
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/forgot-password')}
          >
            <ThemedText style={{ color: tintColor }}>
              {t('login.forgotPassword')}
            </ThemedText>
          </TouchableOpacity>

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            buttonColor={tintColor}
            loading={isLoading}
            disabled={isLoading}
          >
            {t('login.loginButton')}
          </Button>

          {!isChecking && isAvailable && (
            <Button
              mode="outlined"
              onPress={handleBiometricLogin}
              style={styles.biometricButton}
              icon="fingerprint"
              textColor={tintColor}
              disabled={isLoading}
            >
              {t('login.biometricPrompt')}
            </Button>
          )}

          <TouchableOpacity
            style={styles.registerPrompt}
            onPress={() => router.push('/register')}
            disabled={isLoading}
          >
            <ThemedText style={{ color: tintColor }}>
              {t('login.registerPrompt')}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 16,
    borderRadius: 10,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  formContainer: {
    padding: 16,
    borderRadius: 10,
  },
  input: {
    marginBottom: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
  biometricButton: {
    marginTop: 16,
  },
  registerPrompt: {
    marginTop: 24,
    alignItems: 'center',
  },
});
