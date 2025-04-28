import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemedView } from '@components/ui/ThemedView';
import { ThemedText } from '@components/ui/ThemedText';
import useColorScheme from '@hooks/useColorScheme';
import useThemeColor from '@hooks/useThemeColor';
import useBiometrics from '@hooks/useBiometrics';
import useTranslation from '@hooks/useTranslation';
import { useAuth } from '@contexts/AuthContext';
import { UserRepository } from '@repositories/UserRepository';
import { AuthService } from '@services/AuthService';

export default function Index() {
  console.log('INDEX.TS: Login');
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const onSurfaceVariant = useThemeColor({}, 'onSurfaceVariant');
  const surfaceVariant = useThemeColor({}, 'surfaceVariant');
  const tintColor = useThemeColor({}, 'tint');
  const { isAuthenticated, loading: isAuthLoading, login, refreshAuthState } = useAuth();
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
    // Verificar si la biometría está disponible
    if (!isAvailable) {
      console.log('Biometría no disponible para inicio de sesión');
      Alert.alert(
        t('common.error'),
        t('login.biometricNotAvailable')
      );
      return;
    }

    // Verificar si ya está en proceso de autenticación
    if (isLoading || isChecking) {
      console.log('Proceso de autenticación ya en curso');
      return;
    }

    console.log('Intentando inicio de sesión biométrico');
    setIsLoading(true);

    try {
      // Primero buscar usuarios con biometría habilitada para evitar autenticación innecesaria
      const usersWithBiometrics = await UserRepository.findUsersWithBiometricEnabled();

      if (!usersWithBiometrics || usersWithBiometrics.length === 0) {
        // No hay usuarios con biometría habilitada
        Alert.alert(
          t('login.biometricError'),
          t('login.biometricNotConfigured')
        );
        return;
      }

      // Ahora que sabemos que hay usuarios con biometría, intentar autenticar
      const biometricSuccess = await authenticate(t('login.biometricPrompt'));

      if (!biometricSuccess) {
        console.log('Autenticación biométrica fallida o cancelada');
        return;
      }

      // Procesar según la cantidad de usuarios con biometría habilitada
      if (usersWithBiometrics.length === 1) {
        // Si solo hay un usuario con biometría, iniciar sesión automáticamente
        const user = usersWithBiometrics[0];
        // Verificar que user.id sea un valor válido antes de usarlo
        if (user.id !== undefined) {
          await AuthService.loginWithBiometrics(user.id);
          await refreshAuthState();
          console.log('Inicio de sesión biométrico exitoso para usuario:', user.username);
        } else {
          console.error('Error: ID de usuario indefinido');
          Alert.alert(
            t('common.error'),
            t('login.biometricLoginFailed')
          );
        }
      } else {
        // Si hay múltiples usuarios con biometría, idealmente mostrar opciones
        // TODO: Implementar selector de usuario para múltiples usuarios con biometría
        const user = usersWithBiometrics[0];
        // Verificar que user.id sea un valor válido antes de usarlo
        if (user.id !== undefined) {
          await AuthService.loginWithBiometrics(user.id);
          await refreshAuthState();
          console.log('Inicio de sesión biométrico exitoso (múltiples usuarios disponibles)');
        } else {
          console.error('Error: ID de usuario indefinido');
          Alert.alert(
            t('common.error'),
            t('login.biometricLoginFailed')
          );
        }
      }
    } catch (error) {
      console.error('Error en inicio de sesión biométrico:', error);
      Alert.alert(
        t('common.error'),
        t('login.biometricLoginFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };

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
      backgroundColor: surfaceVariant,
    },
    button: {
      marginTop: 8,
      paddingVertical: 4,
    },
    biometricButton: {
      marginTop: 16,
    },
    registerPrompt: {
      marginTop: 32,
      alignItems: 'center',
    },
  });

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
      <StatusBar style={colorScheme === 'light' ? 'dark' : 'light'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ThemedView style={styles.logoContainer}>
          <ThemedText style={[styles.title, { color: tintColor }]}>
            {t('common.appName')}
          </ThemedText>
          <Image
            source={require('../../assets/images/passkeeper.png')}
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
            theme={{
              colors: {
                primary: tintColor,
                onSurface: onSurfaceVariant,
                surface: surfaceVariant,
              }
            }}
          />

          <TextInput
            label={t('login.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            style={styles.input}
            mode="outlined"
            theme={{
              colors: {
                primary: tintColor,
                onSurface: onSurfaceVariant,
                surface: surfaceVariant,
              }
            }}
            right={
              <TextInput.Icon
                icon={secureTextEntry ? "eye" : "eye-off"}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
                color={onSurfaceVariant}
              />
            }
          />

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
            <ThemedText style={{ color: tintColor, fontSize: 16 }}>
              {t('login.registerPrompt')}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}


