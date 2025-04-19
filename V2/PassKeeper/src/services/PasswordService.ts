import { Password } from '../types/entities';
import { PasswordRepository } from '../repositories/PasswordRepository';
import { SecurityUtils } from '../utils/SecurityUtils';

export const PasswordService = {
    /**
     * Crea una nueva contraseña cifrada en la base de datos
     */
    createPassword: async (
        password: Omit<Password, 'id' | 'password' | 'iv'>,
        plainPassword: string,
        salt: string
    ): Promise<number> => {
        try {
            // Cifrar la contraseña
            const { encryptedData, iv } = await SecurityUtils.encrypt(plainPassword, salt);

            // Guardar en la base de datos
            return await PasswordRepository.create({
                ...password,
                password: encryptedData,
                iv
            });
        } catch (error) {
            console.error('Error creating encrypted password:', error);
            throw new Error('Error al crear la contraseña cifrada');
        }
    },

    /**
     * Obtiene una contraseña y la descifra
     * 
     * @param id ID de la contraseña
     * @param salt Salt del usuario para descifrado
     * @returns Contraseña con el valor descifrado
     */
    getDecryptedPassword: async (id: number, salt: string): Promise<Password & { decryptedPassword: string }> => {
        try {
            // Obtener la contraseña de la base de datos
            const password = await PasswordRepository.findById(id);

            if (!password) {
                throw new Error('Contraseña no encontrada');
            }

            // Descifrar la contraseña
            const decryptedPassword = await SecurityUtils.decrypt(
                password.password,
                salt,
                password.iv
            );

            // Devolver la contraseña con el valor descifrado
            return {
                ...password,
                decryptedPassword
            };
        } catch (error) {
            console.error('Error decrypting password:', error);
            throw new Error('Error al descifrar la contraseña');
        }
    },

    /**
     * Actualiza una contraseña existente
     */
    updatePassword: async (
        password: Password,
        newPlainPassword: string | null,
        salt: string
    ): Promise<void> => {
        try {
            // Solo cifrar si hay una nueva contraseña
            if (newPlainPassword !== null) {
                const { encryptedData, iv } = await SecurityUtils.encrypt(newPlainPassword, salt);
                
                // Actualizar la contraseña en la base de datos con los nuevos valores cifrados
                await PasswordRepository.update({
                    ...password,
                    password: encryptedData,
                    iv
                });
            } else {
                // Si no hay nueva contraseña, solo actualizar los otros campos
                await PasswordRepository.update(password);
            }
        } catch (error) {
            console.error('Error updating encrypted password:', error);
            throw new Error('Error al actualizar la contraseña cifrada');
        }
    },

    /**
     * Obtiene todas las contraseñas de un usuario
     * 
     * @param userId ID del usuario
     * @returns Lista de contraseñas
     */
    getAllPasswords: async (userId: number): Promise<Password[]> => {
        try {
            // Verificar que el userId sea válido
            if (!userId) {
                console.log('No se proporcionó un ID de usuario válido');
                return [];
            }
            
            const passwords = await PasswordRepository.findByUserId(userId);
            return passwords || [];
        } catch (error) {
            console.error('Error getting all passwords:', error);
            // En lugar de lanzar un error, devolvemos un array vacío
            // y registramos el error para depuración
            console.warn('Devolviendo lista vacía debido al error');
            return [];
        }
    },

    /**
     * Busca contraseñas que coincidan con la consulta
     * 
     * @param userId ID del usuario
     * @param query Texto a buscar
     * @returns Lista de contraseñas que coinciden con la búsqueda
     */
    searchPasswords: async (userId: number, query: string): Promise<Password[]> => {
        try {
            // Verificar que el userId sea válido
            if (!userId) {
                console.log('No se proporcionó un ID de usuario válido para la búsqueda');
                return [];
            }
            
            const passwords = await PasswordRepository.search(userId, query);
            return passwords || [];
        } catch (error) {
            console.error('Error searching passwords:', error);
            // En lugar de lanzar un error, devolvemos un array vacío
            console.warn('Devolviendo lista vacía de búsqueda debido al error');
            return [];
        }
    },

    /**
     * Elimina una contraseña
     * 
     * @param id ID de la contraseña a eliminar
     */
    deletePassword: async (id: number): Promise<void> => {
        try {
            await PasswordRepository.delete(id);
        } catch (error) {
            console.error('Error deleting password:', error);
            throw new Error('Error al eliminar la contraseña');
        }
    },
};
