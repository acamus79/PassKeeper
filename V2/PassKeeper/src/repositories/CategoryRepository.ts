import { db } from '../database/database';
import { Category } from '../types/entities';

export const CategoryRepository = {
    create: async (category: Omit<Category, 'id'>): Promise<number> => {
        try {
            // Usar runAsync para operaciones de escritura que devuelven lastInsertRowId
            const result = await db.runAsync(
                `INSERT INTO categories (name, icon, color, user_id) 
                VALUES (?, ?, ?, ?)`,
                category.name,
                category.icon || null,
                category.color || null,
                category.user_id,

            );
            return result.lastInsertRowId;
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    },

    findByUserId: async (userId: number): Promise<Category[]> => {
        try {
            // Obtener tanto las categorías del sistema (user_id=0) como las del usuario específico
            return await db.getAllAsync<Category>(
                'SELECT * FROM categories WHERE user_id = ? OR user_id = 0 ORDER BY id',
                userId
            );
        } catch (error) {
            console.error('Error finding categories by user id:', error);
            throw error;
        }
    },

    findAll: async (): Promise<Category[]> => {
        try {
            // Obtener todas las categorías ordenadas por nombre
            return await db.getAllAsync<Category>(
                'SELECT * FROM categories ORDER BY name'
            );
        } catch (error) {
            console.error('Error finding all categories:', error);
            throw error;
        }
    },

    findById: async (id: number): Promise<Category | null> => {
        try {
            // Usar getFirstAsync para obtener una sola fila
            return await db.getFirstAsync<Category>(
                'SELECT * FROM categories WHERE id = ?',
                id
            );
        } catch (error) {
            console.error('Error finding category by id:', error);
            throw error;
        }
    },

    update: async (category: Category): Promise<void> => {
        try {
            if (!category.id) {
                throw new Error('Category ID is required for update');
            }
            // Usar runAsync para operaciones de actualización
            await db.runAsync(
                `UPDATE categories SET 
                name = ?, 
                icon = ?, 
                color = ?, 
                updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime') 
                WHERE id = ?`,
                category.name,
                category.icon || null,
                category.color || null,
                category.id
            );
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    },

    delete: async (id: number): Promise<void> => {
        try {
            // Usar runAsync para operaciones de eliminación
            await db.runAsync(
                'DELETE FROM categories WHERE id = ?',
                id
            );
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    }
};
