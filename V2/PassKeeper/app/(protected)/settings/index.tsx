import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { List, Switch, Divider } from 'react-native-paper';
import { ThemedView } from '@components/ui/ThemedView';
import useTranslation from '@hooks/useTranslation';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import useBiometrics from '@hooks/useBiometrics';
import { UserService } from '@services/UserService';
import { AuthService } from '@services/AuthService';
import { ExportImportService } from '@services/ExportImportService';
import { resetDatabase } from '@database/database';
import * as SecureStore from 'expo-secure-store';
import useThemeColor from '@hooks/useThemeColor';
import { version } from '../../../package.json';
import { ScrollModal } from '@components/modals/ScrollModal';
import { termsAndConditions } from '@constants/TermsAndConditions';
import { faqs } from '@constants/FAQs';
import { privacyPolicy } from '@constants/PrivacyPolicy';
import { router } from 'expo-router';

// Definición de estilos estáticos
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    divider: {
        marginVertical: 8,
    },
});

export default function SettingsScreen() {
    const { t, currentLanguage, changeLanguage } = useTranslation();
    const { logout, userId } = useAuth();
    const { theme, setThemePreference } = useTheme();
    const { isAvailable, authenticate } = useBiometrics();

    // Obtener colores del tema
    const primaryColor = useThemeColor({}, 'primary');
    const errorColor = useThemeColor({}, 'error');
    const warningColor = useThemeColor({}, 'warning');
    const infoColor = useThemeColor({}, 'info');
    const successColor = useThemeColor({}, 'success');
    const onSurfaceVariant = useThemeColor({}, 'onSurfaceVariant');

    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [autoLockEnabled, setAutoLockEnabled] = useState(true);
    const [autoLockTimeout, setAutoLockTimeout] = useState(5);
    const isDarkMode = theme === 'dark';

    // Estados para los modales
    const [termsModalVisible, setTermsModalVisible] = useState(false);
    const [faqModalVisible, setFaqModalVisible] = useState(false);
    const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

    // Estilos que dependen del tema
    const themedStyles = StyleSheet.create({
        logoutText: {
            color: errorColor,
        },
        dangerText: {
            color: errorColor,
        },
    });

    // Cargar el estado actual de la autenticación biométrica
    useEffect(() => {
        const loadBiometricSettings = async () => {
            try {
                // Solo cargar la configuración si la biometría está disponible
                if (isAvailable && userId) {
                    const biometricStatus = await UserService.getBiometricStatus(userId);
                    setIsBiometricEnabled(biometricStatus === 1);
                } else {
                    // Si no está disponible, asegurarse de que esté desactivada
                    setIsBiometricEnabled(false);
                }
            } catch (error) {
                console.error('Error al cargar configuración biométrica:', error);
            }
        };

        loadBiometricSettings();
    }, [userId, isAvailable]);

    // Cargar configuración de Auto-Lock
    useEffect(() => {
        const loadAutoLockSettings = async () => {
            try {
                // No longer need userId for auto-lock settings
                const settings = await UserService.getAutoLockSettings();
                setAutoLockEnabled(settings.enabled);
                setAutoLockTimeout(settings.timeout);

                // No need to update in AuthService since UserService now directly uses SecureStore
            } catch (error) {
                console.error('Error al cargar configuración de auto-lock:', error);
            }
        };

        loadAutoLockSettings();
    }, []);  // Removed userId dependency since it's no longer needed

    const handleToggleBiometric = async (value: boolean) => {
        try {
            if (!userId) return;

            if (value) {
                // Si está activando, primero autenticar
                const success = await authenticate(t('biometric.confirmEnable'));
                if (!success) {
                    console.log('Autenticación biométrica fallida o cancelada');
                    return;
                }
            }

            // Actualizar a través del servicio
            await UserService.updateBiometric(userId, value);
            setIsBiometricEnabled(value);
            console.log(`Autenticación biométrica ${value ? 'activada' : 'desactivada'}`);
        } catch (error) {
            console.error('Error al cambiar configuración biométrica:', error);
        }
    };

    const handleToggleAutoLock = async (value: boolean) => {
        try {
            // No longer need userId for auto-lock settings
            await UserService.updateAutoLockSettings({
                enabled: value,
                timeout: autoLockTimeout
            });
            setAutoLockEnabled(value);
        } catch (error) {
            console.error('Error al cambiar configuración de auto-lock:', error);
        }
    };

    const handleChangeAutoLockTimeout = async (timeout: number) => {
        try {
            // No longer need userId for auto-lock settings
            await UserService.updateAutoLockSettings({
                enabled: autoLockEnabled,
                timeout: timeout
            });

            setAutoLockTimeout(timeout);
        } catch (error) {
            console.error('Error al cambiar tiempo de auto-lock:', error);
        }
    };

    const handleToggleDarkMode = async (value: boolean) => {
        await setThemePreference(value ? 'dark' : 'light');
    };

    const handleToggleLanguage = () => {
        // Alternar entre español e inglés
        const newLanguage = currentLanguage === 'es' ? 'en' : 'es';
        changeLanguage(newLanguage);
    };

    const handleLogout = async () => {
        try {
            await logout();
            console.log('Sesión cerrada correctamente');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    const handleResetDatabase = async () => {
        try {
            const success = await resetDatabase();
            if (success) {
                console.log('Base de datos reinicializada correctamente');
                // Cerrar sesión para que el usuario tenga que volver a iniciar sesión
                await logout();
            } else {
                console.error('Error al reinicializar la base de datos');
            }
        } catch (error) {
            console.error('Error al reinicializar la base de datos:', error);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView>
                <List.Section>
                    <List.Subheader>{t('settings.security')}</List.Subheader>
                    {isAvailable && (
                        <List.Item
                            title={t('settings.biometricAuth')}
                            titleStyle={{ color: onSurfaceVariant, fontWeight: 'bold' }}
                            description={t('settings.biometricDescription')}
                            descriptionStyle={{ color: onSurfaceVariant }}
                            left={props => <List.Icon {...props} icon="fingerprint" color={infoColor} />}
                            right={props =>
                                <Switch
                                    value={isBiometricEnabled}
                                    onValueChange={handleToggleBiometric}
                                />
                            }
                        />
                    )}
                    <List.Item
                        title={t('settings.autoLock')}
                        titleStyle={{ color: onSurfaceVariant, fontWeight: 'bold' }}
                        description={t('settings.autoLockDescription')}
                        descriptionStyle={{ color: onSurfaceVariant }}
                        left={props => <List.Icon {...props} icon="lock-clock" color={infoColor} />}
                        right={props =>
                            <Switch
                                value={autoLockEnabled}
                                onValueChange={handleToggleAutoLock}
                            />
                        }
                    />
                    {autoLockEnabled && (
                        <List.Item
                            title={t('settings.autoLockTimeout')}
                            titleStyle={{ color: onSurfaceVariant, fontWeight: 'bold' }}
                            description={`La aplicación se bloqueará después de ${autoLockTimeout} ${autoLockTimeout === 1 ? 'minuto' : 'minutos'} de inactividad`}
                            descriptionStyle={{ color: onSurfaceVariant }}
                            left={props => <List.Icon {...props} icon="timer-outline" color={infoColor} />}
                            right={props => (
                                <List.Icon {...props} icon="chevron-right" />
                            )}
                            onPress={() => {
                                // Alternar entre valores predefinidos
                                const nextTimeout = autoLockTimeout === 1 ? 5 :
                                    autoLockTimeout === 5 ? 15 :
                                        autoLockTimeout === 15 ? 30 : 1;
                                handleChangeAutoLockTimeout(nextTimeout);
                            }}
                        />
                    )}
                    <List.Item
                        title={t('settings.exportImport')}
                        titleStyle={{ color: onSurfaceVariant, fontWeight: 'bold' }}
                        description={t('settings.exportImportDescription')}
                        descriptionStyle={{ color: onSurfaceVariant }}
                        left={props => <List.Icon {...props} icon="database-export-outline" color={infoColor} />}
                        onPress={() => router.push('/settings/export-import')}
                    />
                </List.Section>

                <Divider style={styles.divider} />

                <List.Section>
                    <List.Subheader>{t('settings.appearance')}</List.Subheader>
                    <List.Item
                        title={t('settings.darkMode')}
                        titleStyle={{ color: onSurfaceVariant, fontWeight: 'bold' }}
                        description={isDarkMode ? t('settings.darkModeEnabled') : t('settings.darkModeDisabled')}
                        descriptionStyle={{ color: onSurfaceVariant }}
                        left={props => <List.Icon {...props} icon="theme-light-dark" color={infoColor} />}
                        right={props => <Switch value={isDarkMode} onValueChange={handleToggleDarkMode} />}
                    />
                    <List.Item
                        title={t('settings.language')}
                        titleStyle={{ color: onSurfaceVariant, fontWeight: 'bold' }}
                        description={currentLanguage === 'es' ? 'Español' : 'English'}
                        descriptionStyle={{ color: onSurfaceVariant }}
                        left={props => <List.Icon {...props} icon="translate" color={infoColor} />}
                        onPress={handleToggleLanguage}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                    />
                </List.Section>

                <Divider style={styles.divider} />

                <List.Section>
                    <List.Subheader>{t('settings.info')}</List.Subheader>
                    <List.Item
                        title={t('settings.FAQ')}
                        titleStyle={{ color: onSurfaceVariant, fontWeight: 'bold' }}
                        description={t('settings.FAQDescription')}
                        descriptionStyle={{ color: onSurfaceVariant }}
                        left={props => <List.Icon {...props} icon="help-circle-outline" color={infoColor} />}
                        onPress={() => setFaqModalVisible(true)}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                    />
                    <List.Item
                        title={t('settings.privacyPolicy')}
                        titleStyle={{ color: onSurfaceVariant, fontWeight: 'bold' }}
                        description={t('settings.privacyPolicyDescription')}
                        descriptionStyle={{ color: onSurfaceVariant }}
                        left={props => <List.Icon {...props} icon="shield-lock-outline" color={infoColor} />}
                        onPress={() => setPrivacyModalVisible(true)}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                    />
                    <List.Item
                        title={t('settings.termsAndConditions')}
                        titleStyle={{ color: onSurfaceVariant, fontWeight: 'bold' }}
                        description={t('settings.termsAndConditionsDescription')}
                        descriptionStyle={{ color: onSurfaceVariant }}
                        left={props => <List.Icon {...props} icon="file-document-outline" color={infoColor} />}
                        onPress={() => setTermsModalVisible(true)}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                    />
                    <List.Item
                        title={t('settings.version')}
                        titleStyle={{ color: onSurfaceVariant, fontWeight: 'bold' }}
                        description={version}
                        descriptionStyle={{ color: onSurfaceVariant }}
                        left={props => <List.Icon {...props} icon="information" color={infoColor} />}
                    />
                </List.Section>

                <Divider style={styles.divider} />

                <List.Section>
                    <List.Subheader>{t('settings.account')}</List.Subheader>
                    <List.Item
                        title={t('settings.logout')}
                        left={props => <List.Icon {...props} icon="logout" color={errorColor} />}
                        onPress={handleLogout}
                        titleStyle={themedStyles.logoutText}
                    />
                </List.Section>

                {/* Sección de desarrollo para pruebas - siempre visible durante desarrollo */}
                <Divider style={styles.divider} />
                <List.Section>
                    <List.Subheader>Desarrollo</List.Subheader>
                    <List.Item
                        title="Resetear Base de Datos"
                        description="Borra todos los datos y cierra la sesión"
                        left={props => <List.Icon {...props} icon="database-refresh" color={errorColor} />}
                        onPress={handleResetDatabase}
                        titleStyle={themedStyles.dangerText}
                    />
                    <List.Item
                        title="Probar Auto-Lock"
                        description="Simula que ha pasado el tiempo de inactividad"
                        left={props => <List.Icon {...props} icon="timer-sand" color={warningColor} />}
                        onPress={async () => {
                            try {
                                // Obtener el tiempo actual
                                const currentTime = Date.now();
                                // Establecer la última actividad a un tiempo anterior
                                // que supere el tiempo de inactividad configurado
                                const timeToSubtract = (autoLockTimeout * 60 * 1000) + 5000; // Añadir 5 segundos extra
                                const lastActivity = currentTime - timeToSubtract;

                                // Guardar manualmente este tiempo como última actividad
                                await SecureStore.setItemAsync('session_last_activity', lastActivity.toString());

                                console.log(`Simulando inactividad de ${autoLockTimeout} minutos`);

                                // Forzar la verificación de expiración
                                const hasExpired = await AuthService.hasSessionExpired();
                                console.log('¿La sesión ha expirado?', hasExpired);

                                if (hasExpired) {
                                    alert(`La sesión ha expirado por inactividad. Se cerrará la sesión.`);
                                    // Forzar el cierre de sesión
                                    setTimeout(() => {
                                        logout();
                                    }, 1500); // Pequeño retraso para que el usuario vea el mensaje
                                } else {
                                    alert('La sesión no ha expirado como se esperaba');
                                }
                            } catch (error) {
                                console.error('Error al probar auto-lock:', error);
                            }
                        }}
                    />
                    <List.Item
                        title="Ver Estado de Sesión"
                        description="Muestra información sobre el estado actual de la sesión"
                        left={props => <List.Icon {...props} icon="information" color={infoColor} />}
                        onPress={async () => {
                            try {
                                const lastActivityStr = await SecureStore.getItemAsync('session_last_activity');
                                const timeoutStr = await SecureStore.getItemAsync('session_inactivity_timeout');
                                const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : null;
                                const timeout = timeoutStr ? parseInt(timeoutStr, 10) : null;
                                const currentTime = Date.now();
                                const timeSinceLastActivity = lastActivity ? (currentTime - lastActivity) / 1000 / 60 : null;
                                const hasExpired = await AuthService.hasSessionExpired();
                                const message = `
                                Última actividad: ${lastActivity ? new Date(lastActivity).toLocaleTimeString() : 'No disponible'}
                                Tiempo desde última actividad: ${timeSinceLastActivity ? timeSinceLastActivity.toFixed(2) + ' minutos' : 'No disponible'}
                                Tiempo de inactividad configurado: ${timeout ? (timeout / 1000 / 60).toFixed(2) + ' minutos' : 'No disponible'}
                                Auto-lock habilitado: ${autoLockEnabled ? 'Sí' : 'No'}
                                La sesión ha expirado: ${hasExpired ? 'Sí' : 'No'}
                                `;
                                alert(message);
                            } catch (error) {
                                console.error('Error al obtener estado de sesión:', error);
                            }
                        }}
                    />
                </List.Section>
            </ScrollView>

            {/* Modal de Términos y Condiciones */}
            <ScrollModal
                visible={termsModalVisible}
                onAccept={() => setTermsModalVisible(false)}
                onCancel={() => setTermsModalVisible(false)}
                title={t('settings.termsAndConditions')}
                content={currentLanguage === 'es' ? termsAndConditions.es : termsAndConditions.en}
                acceptText={t('common.understood')}
                cancelText={t('common.close')}
                requireFullScroll={false}
            />

            <ScrollModal
                visible={faqModalVisible}
                onAccept={() => setFaqModalVisible(false)}
                onCancel={() => setFaqModalVisible(false)}
                title={t('settings.FAQ')}
                content={currentLanguage === 'es' ? faqs.es : faqs.en}
                acceptText={t('common.understood')}
                cancelText={t('common.close')}
                requireFullScroll={false}
            />
            <ScrollModal
                visible={privacyModalVisible}
                onAccept={() => setPrivacyModalVisible(false)}
                onCancel={() => setPrivacyModalVisible(false)}
                title={t('settings.privacyPolicy')}
                content={currentLanguage === 'es' ? privacyPolicy.es : privacyPolicy.en}
                acceptText={t('common.understood')}
                cancelText={t('common.close')}
                requireFullScroll={false}
            />
        </ThemedView>
    );
}
