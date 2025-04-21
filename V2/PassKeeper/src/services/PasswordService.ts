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
            console.log('Contraseña cifrada:', encryptedData);
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
     * @param id ID de la contraseña a actualizar
     * @param data Objeto con los campos a actualizar (sin incluir password/iv)
     * @param newPlainPassword La nueva contraseña en texto plano (o null si no cambió)
     * @param salt Salt del usuario para cifrar la nueva contraseña si es necesario
     */
    updatePassword: async (
        id: number,
        // Input data from the screen/caller
        data: Omit<Password, 'id' | 'password' | 'iv' | 'created_at' | 'updated_at' | 'category'> & { category_id: number },
        newPlainPassword: string | null,
        salt: string
    ): Promise<void> => {
        try {
            // --- Start Logic Moved Here ---
            // Object to hold the exact column:value pairs for the repository
            const dbUpdateData: { [column: string]: string | number | null } = {};

            // Map fields from input 'data' to database columns, applying logic
            if (data.title !== undefined) dbUpdateData.title = data.title;
            // Handle nullable fields explicitly
            dbUpdateData.username = data.username || null;
            dbUpdateData.website = data.website || null;
            dbUpdateData.notes = data.notes || null;
            // Handle boolean/number conversion
            if (data.favorite !== undefined) dbUpdateData.favorite = data.favorite ? 1 : 0;
            // Handle foreign key
            if (data.category_id !== undefined) dbUpdateData.category_id = data.category_id;
            // user_id should likely always be present in 'data' if required by logic
            if (data.user_id !== undefined) dbUpdateData.user_id = data.user_id;
            // Add other fields as needed...

            // If a new password was provided, encrypt it and add columns
            if (newPlainPassword !== null) {
                console.log("New password provided, encrypting...");
                const { encryptedData, iv } = await SecurityUtils.encrypt(newPlainPassword, salt);
                dbUpdateData.password = encryptedData;
                dbUpdateData.iv = iv;
            } else {
                 console.log("Password not changed.");
            }
            // --- End Logic Moved Here ---


            // Check if there's anything to update before calling the repository
            if (Object.keys(dbUpdateData).length === 0) {
                 console.log("No changes detected to update in PasswordService.");
                 return; // Nothing to update
            }

            // Call the simplified repository update function
            await PasswordRepository.update(id, dbUpdateData);
            console.log(`PasswordService successfully requested update for id ${id}`);

        } catch (error) {
            console.error(`Error updating password with id ${id} in service:`, error);
            // Throw a user-friendly or service-specific error
            throw new Error('Error al actualizar la contraseña');
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
