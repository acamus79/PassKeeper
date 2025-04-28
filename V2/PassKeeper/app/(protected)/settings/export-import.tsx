import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, TextInput, ScrollView, Clipboard } from 'react-native';
import { Button, Text, ActivityIndicator, Divider, Card, IconButton, Portal, Modal, Surface } from 'react-native-paper';
import { ThemedView } from '@components/ui/ThemedView';
import { useNavigation } from '@react-navigation/native';
import useTranslation from '@hooks/useTranslation';
import { useAuth } from '@contexts/AuthContext';
import { ExportImportService } from '@services/ExportImportService';
import useBiometrics from '@hooks/useBiometrics';
import useThemeColor from '@hooks/useThemeColor';
import * as DocumentPicker from 'expo-document-picker';
import { AuthService } from '@services/AuthService';

export default function ExportImportScreen() {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { userId } = useAuth();
    const { isAvailable, authenticate } = useBiometrics();

    // Estados
    const [loading, setLoading] = useState(false);
    const [externalSalt, setExternalSalt] = useState('');
    const [userSalt, setUserSalt] = useState('');
    const [showSaltInput, setShowSaltInput] = useState(false);
    const [showSaltDisplay, setShowSaltDisplay] = useState(false);
    const [importFile, setImportFile] = useState<string | null>(null);
    const [importStep, setImportStep] = useState<'salt' | 'file'>('salt');
    const [saltCopied, setSaltCopied] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Colores del tema
    const primaryColor = useThemeColor({}, 'primary');
    const errorColor = useThemeColor({}, 'error');
    const onSurfaceVariant = useThemeColor({}, 'onSurfaceVariant');

    useEffect(() => {
        navigation.setOptions({
            title: t('settings.exportImportTitle')
        });
    }, [navigation, t]);

    // Función para autenticar al usuario antes de exportar/importar
    const authenticateUser = async () => {
        try {
            // Verificar si la biometría está disponible
            if (isAvailable) {
                // Intentar autenticación biométrica primero
                const biometricSuccess = await authenticate(t('settings.biometric.confirmAction'));
                if (biometricSuccess) {
                    return true;
                }
            }

            // Si no hay biometría disponible o falló la autenticación biométrica,
            // mostrar modal para autenticación por contraseña
            return new Promise<boolean>((resolve) => {
                setPassword('');
                setPasswordError('');
                setShowPasswordModal(true);

                // Guardar la función de resolución para usarla cuando se complete la verificación
                authResolve = resolve;
            });
        } catch (error) {
            console.error('Error en autenticación:', error);
            return false;
        }
    };

    // Función para verificar la contraseña y continuar
    const verifyPasswordAndContinue = async () => {
        // Validar que exista un ID de usuario y contraseña antes de intentar verificar
        if (!userId || !password.trim()) {
            setPasswordError(t('settings.emptyPassword'));
            return;
        }

        // Activar estado de carga
        //setLoading(true);
        try {
            // Usar el servicio de autenticación para verificar la contraseña por ID
            // Esto mantiene la lógica de verificación en la capa de servicio
            const isValid = await AuthService.verifyPasswordById(userId, password);

            if (isValid) {
                // Si la contraseña es válida, cerrar el modal y continuar con la acción pendiente
                setShowPasswordModal(false);
                setPassword('');
                if (authResolve) {
                    authResolve(true);
                    authResolve = undefined;
                }
            } else {
                // Si la contraseña es inválida, mostrar error
                setPasswordError(t('settings.invalidPassword'));
            }
        } catch (error) {
            console.error('Error al verificar contraseña:', error);
            setPasswordError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    // Función para cancelar la autenticación por contraseña
    const cancelPasswordAuth = () => {
        setShowPasswordModal(false);
        if (authResolve) {
            authResolve(false);
            authResolve = undefined;
        }
    };

    // Función para iniciar el proceso de exportación
    const startExport = async () => {
        if (!userId) {
            Alert.alert(t('common.error'), t('settings.userNotFound'));
            return;
        }

        try {
            setLoading(true);

            // Autenticar al usuario antes de exportar
            const isAuthenticated = await authenticateUser();
            if (!isAuthenticated) {
                Alert.alert(t('common.error'), t('settings.authRequired'));
                setLoading(false);
                return;
            }

            // Obtener el salt del usuario
            const salt = await ExportImportService.exportSalt(userId);
            setUserSalt(salt);
            setShowSaltDisplay(true);

        } catch (error) {
            console.error('Error al obtener salt:', error);
            Alert.alert(t('common.error'), t('settings.exportError'));
            setLoading(false);
        }
    };

    // Función para copiar el salt al portapapeles
    const copySaltToClipboard = async () => {
        if (userSalt) {
            Clipboard.setString(userSalt);
            setSaltCopied(true);
            setTimeout(() => setSaltCopied(false), 2000);
        }
    };

    // Función para completar la exportación después de mostrar el salt
    const completeExport = async () => {
        try {
            setLoading(true);
            if (!userId || !userSalt) {
                Alert.alert(t('common.error'), t('settings.exportDataMissing'));
                return;
            }
            // Exportar datos
            const filePath = await ExportImportService.exportDataWithSalt(userId, false);

            if (filePath) {
                setShowSaltDisplay(false);
                Alert.alert(
                    t('settings.exportSuccess'),
                    t('settings.exportSuccessMessage')
                );
            } else {
                setLoading(false);
                Alert.alert(t('common.error'), t('settings.exportError'));
            }
        } catch (error) {
            console.error('Error al exportar:', error);
            Alert.alert(t('common.error'), t('settings.exportError'));
        } finally {
            setLoading(false);
        }
    };

    // Función para iniciar el proceso de importación
    const startImport = async () => {
        if (!userId) {
            Alert.alert(t('common.error'), t('settings.userNotFound'));
            return;
        }

        try {
            // Autenticar al usuario antes de importar
            const isAuthenticated = await authenticateUser();
            if (!isAuthenticated) {
                Alert.alert(t('common.error'), t('settings.authRequired'));
                return;
            }

            // Mostrar input para salt externo
            setImportStep('salt');
            setShowSaltInput(true);

        } catch (error) {
            console.error('Error al iniciar importación:', error);
            Alert.alert(t('common.error'), t('settings.importError'));
        }
    };

    // Función para seleccionar archivo de importación
    const pickImportFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/*'],
                copyToCacheDirectory: true
            });

            if (result.canceled) {
                return;
            }

            // Guardar la ruta del archivo y luego intentar la importación
            const fileUri = result.assets[0].uri;
            setImportFile(fileUri);

            // Verificar que tenemos todos los datos necesarios antes de continuar
            if (userId && externalSalt && fileUri) {
                // Esperar un momento para asegurar que el estado se ha actualizado
                setTimeout(() => {
                    completeImport(fileUri);
                }, 100);
            }

        } catch (error) {
            console.error('Error al seleccionar archivo:', error);
            Alert.alert(t('common.error'), t('settings.importFileError'));
        }
    };

    // Función para continuar al paso de selección de archivo
    const continueToFileSelection = () => {
        if (!externalSalt) {
            Alert.alert(t('common.error'), t('settings.saltRequired'));
            return;
        }

        setImportStep('file');
        pickImportFile();
    };

    // Función para completar la importación
    const completeImport = async (fileUriParam?: string) => {
        // Usar el parámetro si se proporciona, de lo contrario usar el estado
        const fileUri = fileUriParam || importFile;

        if (!userId || !externalSalt || !fileUri) {
            console.error('Datos incompletos para la importación');
            console.log('externalSalt:', externalSalt);
            console.log('fileUri:', fileUri);
            console.log('importFile estado:', importFile);
            console.log('userId:', userId);
            Alert.alert(t('common.error'), t('settings.importDataMissing'));
            return;
        }

        try {
            setLoading(true);

            // Importar datos con el salt externo y el archivo seleccionado
            const success = await ExportImportService.importDataWithExternalSalt(userId, externalSalt, fileUri);

            if (success) {
                Alert.alert(
                    t('settings.importSuccess'),
                    t('settings.importWithSaltSuccess')
                );
                setShowSaltInput(false);
                setExternalSalt('');
                setImportFile(null);
                setImportStep('salt');
            } else {
                Alert.alert(t('common.error'), t('settings.importWithSaltError'));
            }
        } catch (error) {
            console.error('Error al importar con salt externo:', error);
            Alert.alert(t('common.error'), t('settings.importWithSaltError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView>
                {/* Sección de Exportación */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: onSurfaceVariant }]}>{t('settings.exportTitle')}</Text>
                    <Text style={[styles.description, { color: onSurfaceVariant }]}>{t('settings.exportDescription')}</Text>

                    <Button
                        mode="contained"
                        onPress={startExport}
                        style={[styles.fullButton, { backgroundColor: primaryColor }]}
                        disabled={loading}
                        icon="export"
                    >
                        {t('settings.startExport')}
                    </Button>
                </View>

                <Divider style={styles.divider} />

                {/* Sección de Importación */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: onSurfaceVariant }]}>{t('settings.importTitle')}</Text>
                    <Text style={[styles.description, { color: onSurfaceVariant }]}>{t('settings.importDescription')}</Text>

                    {showSaltInput ? (
                        <Card style={styles.card}>
                            <Card.Title
                                title={t('settings.importStepSalt')}
                                subtitle={importStep === 'salt' ? t('settings.step1of2') : t('settings.step2of2')}
                                titleStyle={{ color: onSurfaceVariant }}
                                subtitleStyle={{ color: onSurfaceVariant }}
                            />
                            <Card.Content>
                                {importStep === 'salt' ? (
                                    <View>
                                        <Text style={[styles.cardText, { color: onSurfaceVariant }]}>{t('settings.enterSaltDescription')}</Text>
                                        <TextInput
                                            style={[styles.saltInput, { color: onSurfaceVariant }]}
                                            placeholder={t('settings.enterSalt')}
                                            placeholderTextColor={onSurfaceVariant}
                                            value={externalSalt}
                                            onChangeText={setExternalSalt}
                                            autoCapitalize="none"
                                        />
                                        <View style={styles.saltButtonContainer}>
                                            <Button
                                                mode="contained"
                                                onPress={continueToFileSelection}
                                                style={[styles.saltButton, { backgroundColor: primaryColor }]}
                                                disabled={loading || !externalSalt}
                                                icon="arrow-right"
                                            >
                                                {t('settings.continue')}
                                            </Button>
                                            <Button
                                                mode="outlined"
                                                onPress={() => {
                                                    setShowSaltInput(false);
                                                    setExternalSalt('');
                                                    setLoading(false);
                                                }}
                                                style={styles.saltButton}
                                                icon="close"
                                            >
                                                {t('common.cancel')}
                                            </Button>
                                        </View>
                                    </View>
                                ) : (
                                    <View>
                                        <Text style={[styles.cardText, { color: onSurfaceVariant }]}>{t('settings.selectFileDescription')}</Text>
                                        <Button
                                            mode="contained"
                                            onPress={pickImportFile}
                                            style={[styles.fullButton, { backgroundColor: primaryColor }]}
                                            disabled={loading}
                                            icon="file-upload"
                                        >
                                            {t('settings.selectFile')}
                                        </Button>
                                        {importFile && (
                                            <Text style={[styles.fileSelected, { color: onSurfaceVariant }]}>{t('settings.fileSelected')}</Text>
                                        )}
                                    </View>
                                )}
                            </Card.Content>
                        </Card>
                    ) : (
                        <Button
                            mode="contained"
                            onPress={startImport}
                            style={[styles.fullButton, { backgroundColor: primaryColor }]}
                            disabled={loading}
                            icon="import"
                        >
                            {t('settings.startImport')}
                        </Button>
                    )}
                </View>
            </ScrollView>

            {/* Modal para mostrar el salt */}
            <Portal>
                <Modal visible={showSaltDisplay} onDismiss={() => setShowSaltDisplay(false)} contentContainerStyle={styles.modalContainer}>
                    <Surface style={styles.modalSurface}>
                        <Text style={[styles.modalTitle, { color: onSurfaceVariant }]}>{t('settings.yourPrivateKey')}</Text>
                        <Text style={[styles.modalWarning, { color: errorColor }]}>{t('settings.saltWarning')}</Text>

                        <View style={styles.saltDisplayContainer}>
                            <Text selectable style={[styles.saltText, { color: onSurfaceVariant }]}>{userSalt}</Text>
                            <IconButton
                                icon="content-copy"
                                size={20}
                                onPress={copySaltToClipboard}
                                style={styles.copyButton}
                            />
                        </View>

                        {saltCopied && (
                            <Text style={[styles.copiedText, { color: 'green' }]}>{t('settings.saltCopied')}</Text>
                        )}

                        <Text style={[styles.modalInstructions, { color: onSurfaceVariant }]}>{t('settings.saltInstructions')}</Text>

                        <View style={styles.modalButtonContainer}>
                            <Button
                                mode="contained"
                                onPress={completeExport}
                                style={[styles.modalButton, { backgroundColor: primaryColor }]}
                            >
                                {t('settings.iSavedMyKey')}
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={() => {
                                    setShowSaltDisplay(false);
                                    setLoading(false);
                                }}
                                style={styles.modalButton}
                            >
                                {t('common.cancel')}
                            </Button>
                        </View>
                    </Surface>
                </Modal>
            </Portal>

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={primaryColor} />
                    <Text style={[styles.loadingText]}>{t('common.loading')}</Text>
                </View>
            )}

            {/* Modal para autenticación por contraseña */}
            <Portal>
                <Modal visible={showPasswordModal} onDismiss={cancelPasswordAuth} contentContainerStyle={styles.modalContainer}>
                    <Surface style={styles.modalSurface}>
                        <Text style={styles.modalTitle}>{t('settings.enterPassword')}</Text>
                        <TextInput
                            style={[styles.saltInput, { color: onSurfaceVariant }]}
                            placeholder={t('login.password')}
                            placeholderTextColor={onSurfaceVariant}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            autoCapitalize="none"
                        />
                        <Text style={{ marginBottom: 10, fontSize: 12, textAlign: 'center', color: onSurfaceVariant }}>
                            {t('settings.pressConfirmToVerify')}
                        </Text>
                        {passwordError ? <Text style={{ color: errorColor, marginBottom: 10 }}>{passwordError}</Text> : null}
                        <View style={styles.modalButtonContainer}>
                            <Button
                                mode="outlined"
                                onPress={cancelPasswordAuth}
                                style={styles.modalButton}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                mode="contained"
                                onPress={verifyPasswordAndContinue}
                                style={styles.modalButton}
                            >
                                {t('common.confirm')}
                            </Button>
                        </View>
                    </Surface>
                </Modal>
            </Portal>
        </ThemedView>
    );
}

// Definición del tipo para almacenar la función de resolución
type AuthResolveFunction = (value: boolean) => void;

// Variable para almacenar la función de resolución
let authResolve: AuthResolveFunction | undefined;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        lineHeight: 20,
    },
    description: {
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingVertical: 4,
    },
    button: {
        flex: 1,
        marginHorizontal: 4,
    },
    fullButton: {
        marginVertical: 8,
    },
    divider: {
        marginVertical: 16,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 8,
    },
    saltInputContainer: {
        marginTop: 8,
        borderRadius: 4,
        padding: 10,
        marginBottom: 8,
    },
    saltButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    saltButton: {
        flex: 1,
        marginHorizontal: 4,
    },
    card: {
        marginVertical: 8,
        elevation: 2,
    },
    cardText: {
        marginBottom: 12,
    },
    fileSelected: {
        marginTop: 8,
        color: 'green',
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 20,
        margin: 20,
    },
    modalSurface: {
        padding: 20,
        borderRadius: 8,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalWarning: {
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    saltInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 10,
        marginBottom: 12,
    },
    saltDisplayContainer: {
        flexDirection: 'row',
        borderRadius: 4,
        padding: 10,
        marginVertical: 12,
        alignItems: 'center',
    },
    saltText: {
        flex: 1,
        fontFamily: 'monospace',
        fontSize: 14,
    },
    copyButton: {
        margin: 0,
    },
    copiedText: {
        textAlign: 'center',
        marginBottom: 8,
    },
    modalInstructions: {
        marginVertical: 16,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    modalButton: {
        marginHorizontal: 8,
    },
});
