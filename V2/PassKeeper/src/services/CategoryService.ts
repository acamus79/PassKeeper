import { Category } from '../types/entities';
import { CategoryRepository } from '../repositories/CategoryRepository';

export const CategoryService = {
    /**
     * Obtiene todas las categorías disponibles para un usuario
     * Incluye tanto las categorías personalizadas del usuario como las categorías predefinidas del sistema
     * 
     * @param userId ID del usuario
     * @returns Lista de categorías
     */
    getUserCategories: async (userId: number): Promise<Category[]> => {
        try {
            if (!userId) {
                console.log('No se proporcionó un ID de usuario válido');
                return [];
            }
            // Obtener categorías del usuario y las predefinidas (user_id=0)
            const categories = await CategoryRepository.findByUserId(userId);
            return categories || [];
        } catch (error) {
            console.error('Error getting user categories:', error);
            console.warn('Devolviendo lista vacía debido al error');
            return [];
        }
    },

    /**
     * Crea una nueva categoría para un usuario
     * 
     * @param category Datos de la categoría a crear
     * @returns ID de la categoría creada
     */
    createCategory: async (category: Omit<Category, 'id'>): Promise<number> => {
        try {
            return await CategoryRepository.create(category);
        } catch (error) {
            console.error('Error creating category:', error);
            throw new Error('Error al crear la categoría');
        }
    },

    /**
     * Actualiza una categoría existente
     * 
     * @param category Categoría con los datos actualizados
     */
    updateCategory: async (category: Category): Promise<void> => {
        try {
            await CategoryRepository.update(category);
        } catch (error) {
            console.error('Error updating category:', error);
            throw new Error('Error al actualizar la categoría');
        }
    },

    /**
     * Elimina una categoría
     * 
     * @param id ID de la categoría a eliminar
     */
    deleteCategory: async (id: number): Promise<void> => {
        try {
            await CategoryRepository.delete(id);
        } catch (error) {
            console.error('Error deleting category:', error);
            throw new Error('Error al eliminar la categoría');
        }
    }
};
