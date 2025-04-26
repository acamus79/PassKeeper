import { useEffect, useCallback, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AuthService } from '@services/AuthService';
import { useAuth } from '@contexts/AuthContext';

/**
 * Hook para rastrear la actividad del usuario y gestionar la expiración de sesión
 */
export default function useActivityTracker() {
    const { logout } = useAuth();
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [autoLockEnabled, setAutoLockEnabled] = useState<boolean>(true);
    const [logoutOnBackground, setLogoutOnBackground] = useState<boolean>(false);

    // Cargar configuración de auto-lock
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const isAutoLockEnabled = await AuthService.isAutoLockEnabled();
                const isLogoutOnBackgroundEnabled = await AuthService.isLogoutOnBackgroundEnabled();

                setAutoLockEnabled(isAutoLockEnabled);
                setLogoutOnBackground(isLogoutOnBackgroundEnabled);

                console.log('Configuración cargada:', {
                    autoLockEnabled: isAutoLockEnabled,
                    logoutOnBackground: isLogoutOnBackgroundEnabled
                });
            } catch (error) {
                console.error('Error al cargar configuración:', error);
            }
        };

        loadSettings();
    }, []);

    // Función para actualizar la marca de tiempo de la última actividad
    const updateActivity = useCallback(async () => {
        if (await AuthService.isLoggedIn()) {
            await AuthService.updateLastActivity();
        }
    }, []);

    // Función para verificar la expiración de la sesión
    const checkExpiration = useCallback(async () => {
        // Solo verificar si auto-lock está habilitado
        if (!autoLockEnabled) return false;

        const hasExpired = await AuthService.hasSessionExpired();
        if (hasExpired && await AuthService.isLoggedIn()) {
            console.log('La sesión ha expirado por inactividad');
            await logout();
            return true;
        }
        return false;
    }, [logout, autoLockEnabled]);

    // Verificar si la sesión ha expirado cuando la app vuelve a primer plano
    const checkSessionExpiration = useCallback(async (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
            // Si la app vuelve a primer plano
            if (await AuthService.isLoggedIn()) {
                // Recargar configuración por si ha cambiado
                const isAutoLockEnabled = await AuthService.isAutoLockEnabled();
                const isLogoutOnBackgroundEnabled = await AuthService.isLogoutOnBackgroundEnabled();
                setAutoLockEnabled(isAutoLockEnabled);
                setLogoutOnBackground(isLogoutOnBackgroundEnabled);

                if (logoutOnBackground) {
                    // Si está configurado para cerrar sesión al volver de segundo plano
                    console.log('La app volvió a primer plano - cerrando sesión por configuración');
                    await logout();
                } else if (autoLockEnabled) {
                    // Si no, verificar si ha expirado por inactividad (solo si auto-lock está habilitado)
                    const expired = await checkExpiration();
                    if (!expired) {
                        // Si la sesión no ha expirado, actualizar la actividad
                        await updateActivity();
                    }
                } else {
                    // Si auto-lock está deshabilitado, solo actualizar la actividad
                    await updateActivity();
                }
            }
        }
    }, [logout, checkExpiration, updateActivity, autoLockEnabled, logoutOnBackground]);

    // Configurar verificación periódica mientras la app está activa
    const setupPeriodicCheck = useCallback(() => {
        // Limpiar cualquier intervalo existente
        if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
        }

        // Solo configurar el intervalo si auto-lock está habilitado
        if (autoLockEnabled) {
            // Verificar cada 30 segundos si la sesión ha expirado
            checkIntervalRef.current = setInterval(async () => {
                if (AppState.currentState === 'active') {
                    await checkExpiration();
                }
            }, 30000); // 30 segundos
        }
    }, [checkExpiration, autoLockEnabled]);

    // Efecto para manejar los cambios de estado de la aplicación
    useEffect(() => {
        const subscription = AppState.addEventListener('change', checkSessionExpiration);

        // Actualizar la actividad cuando se monta el componente
        updateActivity();

        // Configurar verificación periódica
        setupPeriodicCheck();

        return () => {
            subscription.remove();
            // Limpiar el intervalo al desmontar
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        };
    }, [checkSessionExpiration, updateActivity, setupPeriodicCheck]);

    // Devolver funciones que pueden usarse para actualizar manualmente la actividad
    // y verificar la expiración, así como funciones para actualizar la configuración
    return {
        updateActivity,
        checkExpiration,
        setLogoutOnBackground: async (enabled: boolean) => {
            await AuthService.setLogoutOnBackground(enabled);
            setLogoutOnBackground(enabled);
        },
        setAutoLockEnabled: async (enabled: boolean) => {
            await AuthService.setAutoLockEnabled(enabled);
            setAutoLockEnabled(enabled);
        }
    };
}
