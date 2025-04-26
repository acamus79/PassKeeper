import * as SecureStore from 'expo-secure-store';
import { User } from '../types/entities';
import { SecurityUtils } from '@utils/SecurityUtils';
import {
    USER_SALT_KEY_PREFIX,
    SESSION_LAST_ACTIVITY,
    SESSION_INACTIVITY_TIMEOUT,
    SESSION_AUTO_LOCK_ENABLED,
    SESSION_LOGOUT_ON_BACKGROUND,
    SESSION_USER_DATA
} from '@constants/secureStorage';
import { UserRepository } from '../repositories/UserRepository';

// Constante para el tiempo de inactividad predeterminado
const DEFAULT_INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutos en milisegundos

export const AuthService = {
    /**
     * Verifica la contraseña del usuario sin iniciar sesión
     */
    verifyPassword: async (username: string, password: string): Promise<boolean> => {
        try {
            // Buscar usuario por nombre de usuario
            const user: User | null = await UserRepository.findByUsername(username);
            if (!user) {
                return false;
            }

            // Obtener el salt del usuario desde SecureStore
            const saltKey = `${USER_SALT_KEY_PREFIX}${user.id}`;
            const salt = await SecurityUtils.secureRetrieve(saltKey);
            if (!salt) {
                return false;
            }

            // Verificar la contraseña usando el salt
            return await SecurityUtils.checkPassword(
                password,
                user.password,
                salt
            );
        } catch (error) {
            console.error('Password verification error:', error);
            return false;
        }
    },

    /**
     * Verifica la contraseña del usuario usando su ID
     * Este método es útil cuando ya conocemos el ID del usuario y solo necesitamos verificar su contraseña
     */
    verifyPasswordById: async (userId: number, password: string): Promise<boolean> => {
        try {
            // Buscar usuario por ID
            const user: User | null = await UserRepository.findById(userId);
            if (!user) {
                return false;
            }

            // Obtener el salt del usuario desde SecureStore
            const saltKey = `${USER_SALT_KEY_PREFIX}${userId}`;
            const salt = await SecurityUtils.secureRetrieve(saltKey);
            if (!salt) {
                return false;
            }

            // Verificar la contraseña usando el salt
            return await SecurityUtils.checkPassword(
                password,
                user.password,
                salt
            );
        } catch (error) {
            console.error('Password verification by ID error:', error);
            return false;
        }
    },

    /**
     * Actualiza la marca de tiempo de la última actividad
     */
    updateLastActivity: async (): Promise<void> => {
        try {
            const timestamp = Date.now().toString();
            await SecureStore.setItemAsync(SESSION_LAST_ACTIVITY, timestamp);
        } catch (error) {
            console.error('Error updating last activity:', error);
        }
    },

    /**
     * Establece el tiempo de inactividad personalizado
     */
    setInactivityTimeout: async (timeoutMs: number): Promise<void> => {
        try {
            await SecureStore.setItemAsync(SESSION_INACTIVITY_TIMEOUT, timeoutMs.toString());
        } catch (error) {
            console.error('Error setting inactivity timeout:', error);
        }
    },

    /**
     * Establece si el auto-lock está habilitado
     */
    setAutoLockEnabled: async (enabled: boolean): Promise<void> => {
        try {
            await SecureStore.setItemAsync(SESSION_AUTO_LOCK_ENABLED, enabled ? '1' : '0');
        } catch (error) {
            console.error('Error setting auto-lock enabled:', error);
        }
    },

    /**
     * Establece si se debe cerrar sesión al pasar a segundo plano
     */
    setLogoutOnBackground: async (enabled: boolean): Promise<void> => {
        try {
            await SecureStore.setItemAsync(SESSION_LOGOUT_ON_BACKGROUND, enabled ? '1' : '0');
        } catch (error) {
            console.error('Error setting logout on background:', error);
        }
    },

    /**
     * Obtiene el tiempo de inactividad configurado
     */
    getInactivityTimeout: async (): Promise<number> => {
        try {
            const timeoutStr = await SecureStore.getItemAsync(SESSION_INACTIVITY_TIMEOUT);
            return timeoutStr ? parseInt(timeoutStr, 10) : DEFAULT_INACTIVITY_TIMEOUT;
        } catch (error) {
            console.error('Error getting inactivity timeout:', error);
            return DEFAULT_INACTIVITY_TIMEOUT;
        }
    },

    /**
     * Obtiene si el auto-lock está habilitado
     */
    isAutoLockEnabled: async (): Promise<boolean> => {
        try {
            const enabled = await SecureStore.getItemAsync(SESSION_AUTO_LOCK_ENABLED);
            return enabled === '1';
        } catch (error) {
            console.error('Error getting auto-lock enabled:', error);
            return true; // Por defecto, habilitado por seguridad
        }
    },

    /**
     * Obtiene si se debe cerrar sesión al pasar a segundo plano
     */
    isLogoutOnBackgroundEnabled: async (): Promise<boolean> => {
        try {
            const enabled = await SecureStore.getItemAsync(SESSION_LOGOUT_ON_BACKGROUND);
            return enabled === '1';
        } catch (error) {
            console.error('Error getting logout on background:', error);
            return false; // Por defecto, deshabilitado
        }
    },

    /**
     * Verifica si la sesión ha expirado por inactividad
     */
    hasSessionExpired: async (): Promise<boolean> => {
        try {
            // Si el auto-lock está deshabilitado, la sesión nunca expira por inactividad
            const autoLockEnabled = await AuthService.isAutoLockEnabled();
            if (!autoLockEnabled) {
                return false;
            }

            const lastActivityStr = await SecureStore.getItemAsync(SESSION_LAST_ACTIVITY);
            if (!lastActivityStr) {
                return true; // Si no hay marca de tiempo, consideramos que la sesión ha expirado
            }

            const lastActivity = parseInt(lastActivityStr, 10);
            const currentTime = Date.now();
            const timeout = await AuthService.getInactivityTimeout();

            // Verificar si ha pasado más tiempo que el límite de inactividad
            return (currentTime - lastActivity) > timeout;
        } catch (error) {
            console.error('Error checking session expiration:', error);
            return true; // En caso de error, consideramos que la sesión ha expirado
        }
    },

    /**
     * Autentica a un usuario con las credenciales proporcionadas
     */
    login: async (username: string, password: string): Promise<boolean> => {
        try {
            // Buscar usuario por nombre de usuario
            const user: User | null = await UserRepository.findByUsername(username);
            if (!user) {
                return false;
            }

            // Obtener el salt del usuario desde SecureStore
            const saltKey = `${USER_SALT_KEY_PREFIX}${user.id}`;
            const salt = await SecurityUtils.secureRetrieve(saltKey);
            if (!salt) {
                return false;
            }

            // Verificar la contraseña usando el salt
            const isPasswordValid = await SecurityUtils.checkPassword(
                password,
                user.password,
                salt
            );

            if (!isPasswordValid) {
                return false;
            }

            // Guardar datos de sesión y actualizar última actividad
            await Promise.all([
                saveSession(user),
                AuthService.updateLastActivity()
            ]);

            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    },

    /**
     * Cierra la sesión del usuario actual
     */
    logout: async (): Promise<void> => {
        try {
            await Promise.all([
                SecureStore.deleteItemAsync(SESSION_LAST_ACTIVITY),
                SecureStore.deleteItemAsync(SESSION_USER_DATA),
            ]);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    /**
     * Checks if there is an active session
     */
    isLoggedIn: async (): Promise<boolean> => {
        try {
            const userData = await SecureStore.getItemAsync(SESSION_USER_DATA);
            return userData !== null;
        } catch (error) {
            console.error('Session check error:', error);
            return false;
        }
    },

    /**
     * Gets the current user ID
     */
    getCurrentUserId: async (): Promise<number | null> => {
        try {
            const userData = await SecureStore.getItemAsync(SESSION_USER_DATA);
            if (!userData) return null;

            const user = JSON.parse(userData) as User;
            return user.id || null;
        } catch (error) {
            console.error('Get current user ID error:', error);
            return null;
        }
    },

    /**
     * Gets the current username
     */
    getCurrentUsername: async (): Promise<string | null> => {
        try {
            const userData = await SecureStore.getItemAsync(SESSION_USER_DATA);
            if (!userData) return null;

            const user = JSON.parse(userData) as User;
            return user.username || null;
        } catch (error) {
            console.error('Get current username error:', error);
            return null;
        }
    },

    /**
     * Gets the current user data
     */
    getCurrentUser: async (): Promise<User | null> => {
        try {
            const userData = await SecureStore.getItemAsync(SESSION_USER_DATA);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting current user data:', error);
            return null;
        }
    }
};

/**
 * Guarda los datos de sesión del usuario
 */
const saveSession = async (user: User): Promise<void> => {
    try {
        // Guardar datos de sesión
        await SecureStore.setItemAsync(SESSION_USER_DATA, JSON.stringify(user));

        // Verificar y establecer valores predeterminados para auto-lock si no existen
        const [autoLockExists, timeoutExists] = await Promise.all([
            SecureStore.getItemAsync(SESSION_AUTO_LOCK_ENABLED),
            SecureStore.getItemAsync(SESSION_INACTIVITY_TIMEOUT)
        ]);

        // Establecer valores predeterminados solo si no existen
        const promises = [];
        if (autoLockExists === null) {
            promises.push(AuthService.setAutoLockEnabled(true));
        }

        if (timeoutExists === null) {
            promises.push(AuthService.setInactivityTimeout(DEFAULT_INACTIVITY_TIMEOUT));
        }

        if (promises.length > 0) {
            await Promise.all(promises);
        }
    } catch (error) {
        console.error('Save session error:', error);
        throw error;
    }
};
