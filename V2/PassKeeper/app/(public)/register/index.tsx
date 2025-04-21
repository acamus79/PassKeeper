import React, { useState, useEffect } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, View, Alert } from 'react-native';
import { TextInput, Button, Checkbox } from 'react-native-paper';
import { router } from 'expo-router';
import { ThemedView } from '@components/ui/ThemedView';
import { ThemedText } from '@components/ui/ThemedText';
import useThemeColor from '@hooks/useThemeColor';
import useTranslation from '@hooks/useTranslation';
import useBiometrics from '@hooks/useBiometrics';
import { ScrollModal } from '@components/modals/ScrollModal';
import { termsAndConditions } from '@constants/TermsAndConditions';
import { UserService } from '@services/UserService';
import { AuthService } from '@services/AuthService';

export default function RegisterScreen() {
  const { t, currentLanguage } = useTranslation();
  const tintColor = useThemeColor({}, 'tint');
  const { isAvailable, isChecking, checkBiometricAvailability } = useBiometrics();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [termsModalVisible, setTermsModalVisible] = useState(true); // Mostrar al inicio
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [enableBiometrics, setEnableBiometrics] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar biometría al cargar el componente
  useEffect(() => {
    console.log('Checking biometric availability from Register screen');
    checkBiometricAvailability();
  }, []);

  // Obtener el texto de términos y condiciones según el idioma actual
  const termsText = currentLanguage === 'es' ? termsAndConditions.es : termsAndConditions.en;

  const handleRegister = async () => {
    // Validaciones
    if (!username.trim()) {
      Alert.alert(t('common.error'), t('register.usernameRequired'));
      return;
    }

    if (!password.trim()) {
      Alert.alert(t('common.error'), t('register.passwordRequired'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('register.passwordsDoNotMatch'));
      return;
    }

    if (!termsAccepted) {
      setTermsModalVisible(true);
      return;
    }

    try {
      setIsLoading(true);

      // Use UserService instead of UserRepository
      // This handles password hashing, salt generation and secure storage
      const userId = await UserService.register(username, password);

      // Update biometric setting if needed
      if (enableBiometrics && userId) {
        await UserService.updateBiometric(userId, true);
      }

      if (userId) {
        // Iniciar sesión automáticamente después del registro
        const loginSuccess = await AuthService.login(username, password);

        if (loginSuccess) {
          Alert.alert(
            t('common.success'),
            t('register.registrationSuccess'),
            [{ text: t('common.ok'), onPress: () => router.replace('../(protected)/passwords/index') }]
          );
        } else {
          // Si el inicio de sesión falla, redirigir al login
          Alert.alert(
            t('common.success'),
            t('register.registrationSuccessLoginManually'),
            [{ text: t('common.ok'), onPress: () => router.replace('../(public)/index') }]
          );
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(t('common.error'), t('register.registrationError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setTermsModalVisible(false);
  };

  const handleCancelTerms = () => {
    setTermsModalVisible(false);
    // Si el usuario cancela los términos, no se establece termsAccepted a true
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ThemedText style={styles.title}>
          {t('register.title')}
        </ThemedText>

        <TextInput
          label={t('register.username')}
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          mode="outlined"
          autoCapitalize="none"
          theme={{ colors: { primary: tintColor } }}
        />

        <TextInput
          label={t('register.password')}
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

        <TextInput
          label={t('register.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={secureTextEntry}
          style={styles.input}
          mode="outlined"
          theme={{ colors: { primary: tintColor } }}
        />

        <View style={styles.checkboxContainer}>
          <Checkbox
            status={termsAccepted ? 'checked' : 'unchecked'}
            onPress={() => setTermsAccepted(!termsAccepted)}
            color={tintColor}
          />
          <View style={styles.checkboxTextContainer}>
            <ThemedText>{t('register.termsAgreement')}</ThemedText>
            <Button
              mode="text"
              onPress={() => setTermsModalVisible(true)}
              style={styles.termsButton}
              textColor={tintColor}
            >
              {t('terms.showTerms')}
            </Button>
          </View>
        </View>

        {!isChecking && isAvailable && (
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={enableBiometrics ? 'checked' : 'unchecked'}
              onPress={() => setEnableBiometrics(!enableBiometrics)}
              color={tintColor}
            />
            <ThemedText>{t('register.useBiometrics')}</ThemedText>
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleRegister}
          style={styles.button}
          buttonColor={tintColor}
          loading={isLoading}
          disabled={isLoading}
        >
          {t('register.registerButton')}
        </Button>
      </KeyboardAvoidingView>

      <ScrollModal
        visible={termsModalVisible}
        onAccept={handleAcceptTerms}
        onCancel={handleCancelTerms}
        title={t('terms.title')}
        content={termsText}
      />
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
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsButton: {
    marginLeft: 4,
    padding: 0,
  },
  button: {
    marginTop: 16,
    paddingVertical: 4,
  },
});
