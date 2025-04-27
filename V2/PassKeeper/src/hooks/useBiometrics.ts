import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

// Variables para almacenar el estado de la verificación a nivel global
let globalIsChecking = false;
let lastCheckTime = 0;
const CHECK_INTERVAL = 5000; // 5 segundos entre verificaciones

export default function useBiometrics() {
    const [isAvailable, setIsAvailable] = useState(false);
    const [biometryType, setBiometryType] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        checkBiometricAvailability();
    }, []);

    const checkBiometricAvailability = async () => {
        // Evitar verificaciones simultáneas y frecuentes
        const now = Date.now();
        if (globalIsChecking || (now - lastCheckTime < CHECK_INTERVAL)) {
            console.log('HOOK useBiometrics: Evitando múltiples verificaciones simultáneas o frecuentes');
            return;
        }

        globalIsChecking = true;
        setIsChecking(true);

        try {
            console.log('HOOK useBiometrics: checkBiometricAvailability');
            // Verificar si el hardware es compatible
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            console.log('HOOK useBiometrics: Dispositivo compatible con biometría:', hasHardware);

            if (!hasHardware) {
                setIsAvailable(false);
                setBiometryType(null);
                return;
            }

            // Verificar si hay biometría registrada
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            console.log('HOOK useBiometrics: Dispositivo tiene biometria guardada:', isEnrolled);

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

            setIsAvailable(hasHardware && isEnrolled);
            setBiometryType(biometricType);

        } catch (error) {
            console.error('Error checking biometric availability:', error);
            setIsAvailable(false);
            setBiometryType(null);
        } finally {
            setIsChecking(false);
            globalIsChecking = false;
            lastCheckTime = Date.now();
        }
    };

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
        checkBiometricAvailability
    };
}
