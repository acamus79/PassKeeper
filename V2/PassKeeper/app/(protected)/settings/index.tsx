import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { List, Switch, Divider } from 'react-native-paper';
import { ThemedView } from '@components/ui/ThemedView';
import useTranslation from '@hooks/useTranslation';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import useBiometrics from '@hooks/useBiometrics';
import { UserService } from '@services/UserService';
import { AuthService } from '@services/AuthService';
import { resetDatabase } from '@database/database';
import * as SecureStore from 'expo-secure-store';

export default function SettingsScreen() {
    const { t } = useTranslation();
    const { logout, userId } = useAuth();
    const { theme, themePreference, setThemePreference } = useTheme();
    const { isAvailable, authenticate } = useBiometrics();

    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [autoLockEnabled, setAutoLockEnabled] = useState(true);
    const [autoLockTimeout, setAutoLockTimeout] = useState(5);
    const isDarkMode = theme === 'dark';

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

            // No need to update AuthService separately since UserService handles it
            console.log(`Auto-lock ${value ? 'activado' : 'desactivado'}`);
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

            // No need to update AuthService separately since UserService handles it
            console.log(`Tiempo de auto-lock cambiado a ${timeout} minutos`);
        } catch (error) {
            console.error('Error al cambiar tiempo de auto-lock:', error);
        }
    };

    const handleToggleDarkMode = async (value: boolean) => {
        await setThemePreference(value ? 'dark' : 'light');
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
                            description={t('settings.biometricDescription')}
                            left={props => <List.Icon {...props} icon="fingerprint" />}
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
                        description={t('settings.autoLockDescription')}
                        left={props => <List.Icon {...props} icon="lock-clock" />}
                        right={props =>
                            <Switch
                                value={autoLockEnabled}
                                onValueChange={handleToggleAutoLock}
                            />
                        }
                    />

                    {/* Elemento para configurar el tiempo de auto-lock */}
                    {autoLockEnabled && (
                        <List.Item
                            title={t('settings.autoLockTimeout')}
                            description={`La aplicación se bloqueará después de ${autoLockTimeout} ${autoLockTimeout === 1 ? 'minuto' : 'minutos'} de inactividad`}
                            left={props => <List.Icon {...props} icon="timer-outline" />}
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
                </List.Section>

                <List.Section>
                    <List.Subheader>{t('settings.appearance')}</List.Subheader>
                    <List.Item
                        title={t('settings.darkMode')}
                        description={isDarkMode ? t('settings.darkModeEnabled') : t('settings.darkModeDisabled')}
                        left={props => <List.Icon {...props} icon="theme-light-dark" />}
                        right={props => <Switch value={isDarkMode} onValueChange={handleToggleDarkMode} />}
                    />
                </List.Section>

                <List.Section>
                    <List.Subheader>{t('settings.about')}</List.Subheader>
                    <List.Item
                        title={t('settings.version')}
                        description="1.0.0"
                        left={props => <List.Icon {...props} icon="information" />}
                    />
                </List.Section>

                <Divider style={styles.divider} />

                <List.Section>
                    <List.Subheader>{t('settings.account')}</List.Subheader>
                    <List.Item
                        title={t('settings.logout')}
                        left={props => <List.Icon {...props} icon="logout" color="#FF5252" />}
                        onPress={handleLogout}
                        titleStyle={styles.logoutText}
                    />
                </List.Section>

                {/* Sección de desarrollo para pruebas - siempre visible durante desarrollo */}
                <Divider style={styles.divider} />
                <List.Section>
                    <List.Subheader>Desarrollo</List.Subheader>
                    <List.Item
                        title="Resetear Base de Datos"
                        description="Borra todos los datos y cierra la sesión"
                        left={props => <List.Icon {...props} icon="database-refresh" color="#FF5252" />}
                        onPress={handleResetDatabase}
                        titleStyle={styles.dangerText}
                    />
                    <List.Item
                        title="Probar Auto-Lock"
                        description="Simula que ha pasado el tiempo de inactividad"
                        left={props => <List.Icon {...props} icon="timer-sand" color="#FF9800" />}
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
                        left={props => <List.Icon {...props} icon="information" color="#2196F3" />}
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
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    divider: {
        marginVertical: 8,
    },
    logoutText: {
        color: '#FF5252',
    },
    dangerText: {
        color: '#FF5252',
    },
});
