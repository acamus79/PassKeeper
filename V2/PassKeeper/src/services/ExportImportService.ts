import { Category, Password } from '../types/entities';
import { CategoryService } from './CategoryService';
import { PasswordService } from './PasswordService';
import * as SecureStore from 'expo-secure-store';
import { SecurityUtils } from '../utils/SecurityUtils';
import { executeInTransaction } from '../utils/DatabaseUtils';
import { USER_SALT_KEY_PREFIX } from '../constants/secureStorage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

/**
 * Tipo para los datos de exportación
 * Excluye campos que no deben exportarse como id, timestamps y user_id
 */
type ExportData = {
    categories: Omit<Category, 'id' | 'created_at' | 'updated_at'>[];
    passwords: Omit<Password, 'id' | 'created_at' | 'updated_at' | 'user_id'>[];
};

/**
 * Tipo para el resultado de la importación
 */
type ImportResult = {
    success: boolean;
    importedCategories: number;
    importedPasswords: number;
    errors: string[];
};

/**
 * Servicio para exportar e importar datos de usuario
 * Permite exportar categorías y contraseñas cifradas, así como el salt del usuario por separado
 * También permite importar datos cifrados utilizando el salt proporcionado
 */
export const ExportImportService = {

    /**
     * Exporta las categorías y contraseñas del usuario en formato cifrado
     * 
     * @param userId ID del usuario cuyos datos se exportarán
     * @param userSalt Salt del usuario para cifrar los datos
     * @returns Cadena JSON con los datos cifrados y metadatos
     */
    async exportUserData(userId: number, userSalt: string): Promise<string> {
        try {
            // Obtener categorías y contraseñas del usuario en paralelo
            const [categories, passwords] = await Promise.all([
                CategoryService.getUserCategories(userId),
                PasswordService.getAllPasswords(userId)
            ]);

            // Filtrar solo las categorías del usuario (excluir las del sistema)
            // y mapear las contraseñas manteniendo el cifrado original
            const exportData: ExportData = {
                categories: categories.filter(c => c.user_id === userId).map(c => ({
                    name: c.name,
                    icon: c.icon,
                    color: c.color,
                    user_id: c.user_id,
                    key: c.key
                })),
                passwords: passwords.map(p => ({
                    title: p.title,
                    username: p.username,
                    password: p.password, // Mantener cifrado original
                    website: p.website,
                    notes: p.notes,
                    favorite: p.favorite,
                    iv: p.iv,
                    category: p.category
                }))
            };

            // Serializar y cifrar los datos
            const serializedData = JSON.stringify(exportData);
            const { encryptedData, iv } = await SecurityUtils.encrypt(serializedData, userSalt);
            if (!encryptedData || !iv) throw new Error('Error en el cifrado de datos');

            // Devolver un objeto JSON con los datos cifrados y metadatos
            return JSON.stringify({
                encrypted: encryptedData,
                iv: iv,
                version: '1.0',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error durante la exportación:', error);
            throw new Error('Error durante la exportación de datos');
        }
    },

    /**
     * Exporta el salt del usuario (debe manejarse y compartirse por separado)
     * 
     * @param userId ID del usuario cuyo salt se exportará
     * @returns Salt del usuario en formato string
     */
    async exportSalt(userId: number): Promise<string> {
        try {
            const saltKey = `${USER_SALT_KEY_PREFIX}${userId}`;
            const salt = await SecureStore.getItemAsync(saltKey);
            if (!salt) throw new Error('Salt no encontrado');
            return salt;
        } catch (error) {
            console.error('Error al exportar el salt:', error);
            throw new Error('Error al exportar la clave privada');
        }
    },

    /**
     * Importa datos cifrados utilizando el salt proporcionado
     * Los datos se descifran con el salt de importación y se vuelven a cifrar con el salt del usuario actual
     * 
     * @param userId ID del usuario que importa los datos
     * @param encryptedPayload Datos cifrados en formato JSON
     * @param importSalt Salt utilizado para cifrar los datos originales
     * @param userSalt Salt del usuario actual para recifrar los datos
     * @returns Resultado de la importación
     */
    async importUserData(
        userId: number,
        encryptedPayload: string,
        importSalt: string,
        userSalt: string
    ): Promise<ImportResult> {
        // Ejecutar toda la importación en una transacción para garantizar la integridad
        return executeInTransaction(async () => {
            const result: ImportResult = {
                success: false,
                importedCategories: 0,
                importedPasswords: 0,
                errors: []
            };

            try {
                // Parsear el payload y descifrar los datos
                const payload = JSON.parse(encryptedPayload);
                const decryptedData = await SecurityUtils.decrypt(payload.encrypted, importSalt, payload.iv);
                const importData: ExportData = JSON.parse(decryptedData);

                // Validar la estructura de los datos importados
                if (!importData.categories || !importData.passwords ||
                    !Array.isArray(importData.categories) ||
                    !Array.isArray(importData.passwords) ||
                    typeof userId !== 'number') {
                    throw new Error('Datos de importación inválidos o userId incorrecto');
                }

                // Importar categorías primero
                for (const category of importData.categories) {
                    try {
                        await CategoryService.createCategory({
                            ...category,
                            user_id: userId // Asignar al usuario actual
                        });
                        result.importedCategories++;
                    } catch (e: any) {
                        result.errors.push(`Error en categoría ${category.name}: ${e.message || 'Error desconocido'}`);
                    }
                }

                // Obtener las categorías recién creadas para mapear los IDs
                const userCategories = await CategoryService.getUserCategories(userId);

                // Importar contraseñas
                for (const password of importData.passwords) {
                    try {
                        // Descifrar la contraseña con el salt de importación
                        const plainPassword = await SecurityUtils.decrypt(
                            password.password,
                            importSalt,
                            password.iv
                        );

                        if (typeof plainPassword !== 'string' || plainPassword.length === 0) {
                            throw new Error('Contraseña descifrada inválida');
                        }

                        // Encontrar la categoría correspondiente por nombre si existe
                        let categoryId = null;
                        if (password.category && password.category.name) {
                            const categoryName = password.category.name; // Extraer el nombre
                            const matchingCategory = userCategories.find(
                                c => c.name === categoryName && c.user_id === userId
                            );
                            if (matchingCategory) {
                                categoryId = matchingCategory.id;
                            }
                        }

                        // Crear la contraseña con el salt del usuario actual
                        await PasswordService.createPassword(
                            {
                                title: password.title,
                                username: password.username,
                                website: password.website,
                                notes: password.notes,
                                favorite: password.favorite,
                                user_id: userId,
                                category: categoryId ? { id: categoryId } as Category : undefined
                            },
                            plainPassword,
                            userSalt // Cifrar con el salt del usuario actual
                        );
                        result.importedPasswords++;
                    } catch (e: any) {
                        result.errors.push(`Error en contraseña ${password.title}: ${e.message || 'Error desconocido'}`);
                    }
                }

                // La importación es exitosa si no hay errores
                result.success = result.errors.length === 0;
                return result;

            } catch (error: any) {
                console.error('Error durante la importación:', error);
                result.errors.push(error.message || 'Error desconocido durante la importación');
                return result;
            }
        });
    },

    /**
     * Exporta los datos del usuario y guarda el archivo en el dispositivo
     * 
     * @param userId ID del usuario cuyos datos se exportarán
     * @param includeSalt Si es true, incluye el salt en el nombre del archivo (no recomendado)
     * @returns Ruta del archivo exportado
     */
    async exportDataWithSalt(userId: number, includeSalt: boolean): Promise<string> {
        try {
            // Obtener el salt del usuario
            const userSalt = await this.exportSalt(userId);

            // Exportar los datos cifrados
            const encryptedData = await this.exportUserData(userId, userSalt);

            // Generar nombre de archivo con fecha y hora
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `passkeeper_export_${timestamp}.pkex`;

            // Guardar el archivo en el directorio de documentos
            if (!FileSystem.documentDirectory) {
                throw new Error('No se pudo acceder al directorio de documentos');
            }

            const filePath = FileSystem.documentDirectory + fileName;
            // Escribir los datos en el archivo
            await FileSystem.writeAsStringAsync(filePath, encryptedData);

            // Compartir el archivo
            await Sharing.shareAsync(filePath, {
                mimeType: 'application/json',
                dialogTitle: 'Exportar datos de PassKeeper',
                UTI: 'public.json'
            });

            return filePath;
        } catch (error) {
            console.error('Error al exportar datos:', error);
            throw new Error('Error al exportar datos');
        }
    },

    /**
     * Importa datos utilizando el salt del usuario actual
     * 
     * @param userId ID del usuario que importa los datos
     * @param filePath Ruta opcional al archivo a importar
     * @returns true si la importación fue exitosa
     */
    async importData(userId: number, filePath?: string): Promise<boolean> {
        try {
            // Obtener el salt del usuario actual
            const userSalt = await this.exportSalt(userId);

            // Leer el archivo seleccionado
            if (!filePath) {
                // Si no se proporciona una ruta, permitir al usuario seleccionar un archivo
                const result = await DocumentPicker.getDocumentAsync({
                    type: ['application/json'],
                    copyToCacheDirectory: true
                });

                if (result.canceled) {
                    throw new Error('Selección de archivo cancelada');
                }

                filePath = result.assets[0].uri;
            }

            const encryptedPayload = await FileSystem.readAsStringAsync(filePath);

            // Importar los datos utilizando el salt del usuario actual
            const result = await this.importUserData(userId, encryptedPayload, userSalt, userSalt);

            return result.success;
        } catch (error) {
            console.error('Error al importar datos:', error);
            return false;
        }
    },

    /**
     * Importa datos utilizando un salt externo
     * 
     * @param userId ID del usuario que importa los datos
     * @param externalSalt Salt externo para descifrar los datos
     * @param filePath Ruta opcional al archivo a importar
     * @returns true si la importación fue exitosa
     */
    async importDataWithExternalSalt(userId: number, externalSalt: string, filePath?: string): Promise<boolean> {
        try {
            // Obtener el salt del usuario actual
            const userSalt = await this.exportSalt(userId);

            // Leer el archivo seleccionado
            if (!filePath) {
                throw new Error('No se proporcionó la ruta del archivo');
            }

            const encryptedPayload = await FileSystem.readAsStringAsync(filePath);

            // Importar los datos utilizando el salt externo y recifrarlos con el salt del usuario actual
            const result = await this.importUserData(userId, encryptedPayload, externalSalt, userSalt);

            return result.success;
        } catch (error) {
            console.error('Error al importar datos con salt externo:', error);
            return false;
        }
    }
};
