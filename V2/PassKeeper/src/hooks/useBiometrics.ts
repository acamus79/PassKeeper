import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { SecurityUtils } from '../utils/SecurityUtils';

// Constantes para almacenamiento seguro
const BIOMETRIC_HARDWARE_KEY = 'biometric_hardware';
const BIOMETRIC_TYPE_KEY = 'biometric_type';

// Variable para evitar verificaciones simultáneas
let globalIsChecking = false;

export default function useBiometrics() {
    const [isAvailable, setIsAvailable] = useState(false);
    const [biometryType, setBiometryType] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        // Al iniciar, solo verificamos si tenemos la información en SecureStore
        loadBiometricHardwareStatus();
    }, []);

    /**
     * Carga el estado del hardware biométrico desde SecureStore
     * Solo verifica el hardware si no hay información guardada
     */
    const loadBiometricHardwareStatus = async () => {
        try {
            setIsChecking(true);

            // Intentar recuperar el estado del hardware desde SecureStore
            const storedHardwareStatus = await SecurityUtils.secureRetrieve(BIOMETRIC_HARDWARE_KEY);
            const storedBiometricType = await SecurityUtils.secureRetrieve(BIOMETRIC_TYPE_KEY);

            if (storedHardwareStatus) {
                const hasHardware = storedHardwareStatus === 'true';
                console.log('HOOK useBiometrics: Recuperado estado de hardware biométrico:', hasHardware);

                // Si no hay hardware, no necesitamos verificar nada más
                if (!hasHardware) {
                    setIsAvailable(false);
                    setBiometryType(null);
                    setIsChecking(false);
                    return;
                }

                // Establecer el tipo de biometría si está almacenado
                if (storedBiometricType) {
                    setBiometryType(storedBiometricType);
                }

                // Verificar si hay biometría registrada (esto siempre se verifica)
                const isEnrolled = await checkBiometricEnrollment();
                setIsAvailable(hasHardware && isEnrolled);
            } else {
                // Si no hay información guardada, verificar el hardware
                await checkBiometricHardware();
            }
        } catch (error) {
            console.error('Error al cargar estado biométrico:', error);
            setIsAvailable(false);
            setBiometryType(null);
        } finally {
            setIsChecking(false);
        }
    };

    /**
     * Verifica si el dispositivo tiene hardware biométrico
     * y guarda el resultado en SecureStore
     */
    const checkBiometricHardware = async () => {
        if (globalIsChecking) {
            console.log('HOOK useBiometrics: Ya hay una verificación en curso');
            return;
        }

        globalIsChecking = true;
        setIsChecking(true);

        try {
            console.log('HOOK useBiometrics: Verificando hardware biométrico');
            // Verificar si el hardware es compatible
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            console.log('HOOK useBiometrics: Dispositivo compatible con biometría:', hasHardware);

            // Guardar el resultado en SecureStore
            await SecurityUtils.secureStore(BIOMETRIC_HARDWARE_KEY, hasHardware.toString());

            if (!hasHardware) {
                setIsAvailable(false);
                setBiometryType(null);
                return;
            }

            // Obtener tipos de autenticación disponibles
            const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
            console.log('HOOK useBiometrics: Tipo de autenticacion soportada:', supportedTypes);

            let biometricType = null;
            if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                biometricType = 'fingerprint';
                console.log('HOOK useBiometrics: Dispositivo tiene huellas dactilares');
            } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                biometricType = 'facialRecognition';
                console.log('HOOK useBiometrics: Dispositivo tiene reconocimiento facial');
            } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
                biometricType = 'iris';
                console.log('HOOK useBiometrics: Dispositivo tiene iris');
            }

            // Guardar el tipo de biometría
            if (biometricType) {
                await SecurityUtils.secureStore(BIOMETRIC_TYPE_KEY, biometricType);
            }

            setBiometryType(biometricType);

            // Verificar si hay biometría registrada
            const isEnrolled = await checkBiometricEnrollment();
            setIsAvailable(hasHardware && isEnrolled);

        } catch (error) {
            console.error('Error al verificar hardware biométrico:', error);
            setIsAvailable(false);
            setBiometryType(null);
        } finally {
            setIsChecking(false);
            globalIsChecking = false;
        }
    };

    /**
     * Verifica si hay biometría registrada en el dispositivo
     * Esta función se llama bajo demanda y no almacena el resultado
     */
    const checkBiometricEnrollment = async (): Promise<boolean> => {
        try {
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            console.log('HOOK useBiometrics: Dispositivo tiene biometría registrada:', isEnrolled);
            return isEnrolled;
        } catch (error) {
            console.error('Error al verificar registro biométrico:', error);
            return false;
        }
    };

    /**
     * Verifica la disponibilidad biométrica completa
     * Esta función se llama explícitamente en momentos específicos:
     * - Registro de usuario
     * - Cambios en configuración de biometría
     * - Exportación de datos
     * - Eliminación de cuenta
     */
    const checkBiometricAvailability = async () => {
        // Esta función ahora verifica tanto el hardware como el registro biométrico
        // Se llama explícitamente en momentos específicos
        if (globalIsChecking) {
            console.log('HOOK useBiometrics: Ya hay una verificación en curso');
            return;
        }

        globalIsChecking = true;
        setIsChecking(true);

        try {
            console.log('HOOK useBiometrics: Verificando disponibilidad biométrica completa');

            // Siempre verificamos el hardware y actualizamos el almacenamiento
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            console.log('HOOK useBiometrics: Dispositivo compatible con biometría:', hasHardware);

            // Guardar el resultado en SecureStore
            await SecurityUtils.secureStore(BIOMETRIC_HARDWARE_KEY, hasHardware.toString());

            if (!hasHardware) {
                setIsAvailable(false);
                setBiometryType(null);
                return;
            }

            // Obtener tipos de autenticación disponibles
            const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

            let biometricType = null;
            if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                biometricType = 'fingerprint';
                console.log('HOOK useBiometrics: Dispositivo tiene huellas dactilares');
            } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                biometricType = 'facialRecognition';
                console.log('HOOK useBiometrics: Dispositivo tiene reconocimiento facial');
            } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
                biometricType = 'iris';
                console.log('HOOK useBiometrics: Dispositivo tiene iris');
            }

            // Guardar el tipo de biometría
            if (biometricType) {
                await SecurityUtils.secureStore(BIOMETRIC_TYPE_KEY, biometricType);
            }

            setBiometryType(biometricType);

            // Verificar si hay biometría registrada
            const isEnrolled = await checkBiometricEnrollment();
            setIsAvailable(hasHardware && isEnrolled);

        } catch (error) {
            console.error('Error al verificar disponibilidad biométrica:', error);
            setIsAvailable(false);
            setBiometryType(null);
        } finally {
            setIsChecking(false);
            globalIsChecking = false;
        }
    };

    /**
     * Autentica al usuario utilizando biometría
     */
    const authenticate = async (promptMessage: string): Promise<boolean> => {
        if (!isAvailable) {
            console.log('Biometrics not available for authentication');
            return false;
        }

        try {
            console.log('Starting biometric authentication...');
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage,
                cancelLabel: 'Cancelar',
                disableDeviceFallback: false,
            });

            console.log('Authentication result:', result);
            return result.success;
        } catch (error) {
            console.error('Biometric authentication error:', error);
            return false;
        }
    };

    return {
        isAvailable,
        biometryType,
        authenticate,
        isChecking,
        checkBiometricAvailability,
        checkBiometricEnrollment
    };
}
