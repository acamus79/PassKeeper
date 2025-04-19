import { UserRepository } from '../repositories/UserRepository';
import { SecurityUtils } from '../utils/SecurityUtils';
import { User } from '../types/entities';
import {
    USER_SALT_KEY_PREFIX,
    SESSION_AUTO_LOCK_ENABLED,
    SESSION_INACTIVITY_TIMEOUT
} from '@constants/secureStorage';

// Añadir métodos para gestionar la configuración de auto-lock
export const UserService = {
    /**
     * Registra un nuevo usuario en el sistema
     */
    register: async (username: string, password: string): Promise<number> => {
        try {
            // Verificar si el nombre de usuario ya existe
            const existingUser = await UserRepository.findByUsername(username);
            if (existingUser) {
                throw new Error('El nombre de usuario ya está en uso');
            }

            // Generar salt y hashear contraseña
            const salt = await SecurityUtils.generateSalt();
            const hashedPassword = await SecurityUtils.hashPassword(password, salt);

            // Crear el usuario en la base de datos
            const userId = await UserRepository.create({
                username,
                password: hashedPassword,
                biometric: 0
            });

            // Almacenar el salt en SecureStore
            const saltKey = `${USER_SALT_KEY_PREFIX}${userId}`;
            await SecurityUtils.secureStore(saltKey, salt);

            return userId;
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    },

    /**
     * Actualiza la información de un usuario existente
     */
    updateUser: async (user: User, newPassword?: string): Promise<void> => {
        try {
            // Si hay una nueva contraseña, actualizarla con un nuevo salt
            if (newPassword) {
                // Generar nuevo salt
                const newSalt = await SecurityUtils.generateSalt();

                // Hashear la nueva contraseña
                user.password = await SecurityUtils.hashPassword(newPassword, newSalt);

                // Actualizar el salt en SecureStore
                await SecurityUtils.secureStore(`user_salt_${user.id}`, newSalt);
            }

            // Actualizar el usuario en la base de datos
            await UserRepository.update(user);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    /**
     * Actualiza la configuración biométrica de un usuario
     */
    updateBiometric: async (userId: number, enableBiometric: boolean): Promise<void> => {
        try {
            await UserRepository.updateBiometric(userId, enableBiometric ? 1 : 0);
        } catch (error) {
            console.error('Error updating biometric settings:', error);
            throw error;
        }
    },

    /**
     * Elimina un usuario y todos sus datos asociados
     */
    deleteUser: async (userId: number): Promise<void> => {
        try {
            // Eliminar el usuario de la base de datos
            await UserRepository.delete(userId);
            // Eliminar el salt asociado del usuario
            await SecurityUtils.secureDelete(`user_salt_${userId}`);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    /**
     * Obtiene el estado de la configuración biométrica de un usuario
     */
    getBiometricStatus: async (userId: number): Promise<number> => {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            return user.biometric || 0;
        } catch (error) {
            console.error('Error getting biometric status:', error);
            throw error;
        }
    },

    /**
     * Actualiza la configuración de auto-lock de un usuario
     * Ahora solo usa SecureStore y no la tabla de usuarios
     */
    updateAutoLockSettings: async (settings: { enabled: boolean, timeout: number }): Promise<void> => {
        try {
            const { enabled, timeout } = settings;
            const timeoutMs = timeout * 60 * 1000; // Convertir minutos a ms

            await Promise.all([
                SecurityUtils.secureStore(SESSION_AUTO_LOCK_ENABLED, enabled ? '1' : '0'),
                SecurityUtils.secureStore(SESSION_INACTIVITY_TIMEOUT, timeoutMs.toString())
            ]);
        } catch (error) {
            console.error('Error updating auto-lock settings:', error);
            throw error;
        }
    },

    /**
     * Obtiene la configuración de auto-lock del usuario actual
     * Ahora solo usa SecureStore y no la tabla de usuarios
     */
    getAutoLockSettings: async (): Promise<{ enabled: boolean, timeout: number }> => {
        try {
            const [enabledStr, timeoutStr] = await Promise.all([
                SecurityUtils.secureRetrieve(SESSION_AUTO_LOCK_ENABLED),
                SecurityUtils.secureRetrieve(SESSION_INACTIVITY_TIMEOUT)
            ]);

            const enabled = enabledStr === '1';
            const defaultTimeoutMs = 3 * 60 * 1000; // 3 minutos por defecto
            const timeoutMs = timeoutStr ? parseInt(timeoutStr, 10) : defaultTimeoutMs;

            return {
                enabled,
                timeout: Math.round(timeoutMs / (60 * 1000)) // Convertir ms a minutos
            };
        } catch (error) {
            console.error('Error getting auto-lock settings:', error);
            throw error;
        }
    }
};
