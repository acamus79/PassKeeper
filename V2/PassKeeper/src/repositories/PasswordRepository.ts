import { db } from '../database/database';
import { Password, Category } from '../types/entities';

export const PasswordRepository = {
    create: async (password: Omit<Password, 'id' | 'created_at' | 'updated_at'> & { category_id?: number }): Promise<number> => {
        try {
            const result = await db.runAsync(
                `INSERT INTO passwords (
                title, username, password, website, notes, 
                category_id, favorite, iv, user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                password.title,
                password.username || null,
                password.password,
                password.website || null,
                password.notes || null,
                password.category_id || null,
                password.favorite || 0,
                password.iv,
                password.user_id
            );
            return result.lastInsertRowId;
        } catch (error) {
            console.error('Error creating password:', error);
            throw error;
        }
    },

    findByUserId: async (userId: number): Promise<Password[]> => {
        try {
            const results = await db.getAllAsync<any>(
                `SELECT 
                    p.*,
                    c.id as cat_id,
                    c.name as cat_name,
                    c.icon as cat_icon,
                    c.color as cat_color,
                    c.user_id as cat_user_id
                FROM passwords p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.user_id = ?
                ORDER BY p.title`,
                userId
            );

            // Transform results to include category object
            return results.map(row => {
                const password: Password = {
                    id: row.id,
                    title: row.title,
                    username: row.username,
                    password: row.password,
                    website: row.website,
                    notes: row.notes,
                    favorite: row.favorite,
                    iv: row.iv,
                    user_id: row.user_id,
                    created_at: row.created_at,
                    updated_at: row.updated_at
                };

                // Add category if it exists
                if (row.cat_id) {
                    password.category = {
                        id: row.cat_id,
                        name: row.cat_name,
                        icon: row.cat_icon,
                        color: row.cat_color,
                        user_id: row.cat_user_id
                    };
                }

                return password;
            });
        } catch (error) {
            console.error('Error finding passwords by user id:', error);
            throw error;
        }
    },

    findById: async (id: number): Promise<Password | null> => {
        try {
            const result = await db.getFirstAsync<any>(
                `SELECT 
                    p.*,
                    c.id as cat_id,
                    c.name as cat_name,
                    c.icon as cat_icon,
                    c.color as cat_color,
                    c.user_id as cat_user_id
                FROM passwords p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.id = ?`,
                id
            );

            if (!result) return null;

            const password: Password = {
                id: result.id,
                title: result.title,
                username: result.username,
                password: result.password,
                website: result.website,
                notes: result.notes,
                favorite: result.favorite,
                iv: result.iv,
                user_id: result.user_id,
                created_at: result.created_at,
                updated_at: result.updated_at
            };

            // Add category if it exists
            if (result.cat_id) {
                password.category = {
                    id: result.cat_id,
                    name: result.cat_name,
                    icon: result.cat_icon,
                    color: result.cat_color,
                    user_id: result.cat_user_id
                };
            }

            return password;
        } catch (error) {
            console.error('Error finding password by id:', error);
            throw error;
        }
    },

    findByCategoryId: async (categoryId: number): Promise<Password[]> => {
        try {
            const results = await db.getAllAsync<any>(
                `SELECT 
                    p.*,
                    c.id as cat_id,
                    c.name as cat_name,
                    c.icon as cat_icon,
                    c.color as cat_color,
                    c.user_id as cat_user_id
                FROM passwords p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.category_id = ?
                ORDER BY p.title`,
                categoryId
            );

            // Transform results to include category object
            return results.map(row => {
                const password: Password = {
                    id: row.id,
                    title: row.title,
                    username: row.username,
                    password: row.password,
                    website: row.website,
                    notes: row.notes,
                    favorite: row.favorite,
                    iv: row.iv,
                    user_id: row.user_id,
                    created_at: row.created_at,
                    updated_at: row.updated_at
                };

                // Add category if it exists
                if (row.cat_id) {
                    password.category = {
                        id: row.cat_id,
                        name: row.cat_name,
                        icon: row.cat_icon,
                        color: row.cat_color,
                        user_id: row.cat_user_id
                    };
                }

                return password;
            });
        } catch (error) {
            console.error('Error finding passwords by category id:', error);
            throw error;
        }
    },

    search: async (userId: number, query: string): Promise<Password[]> => {
        try {
            const searchQuery = `%${query}%`;
            const results = await db.getAllAsync<any>(
                `SELECT 
                    p.*,
                    c.id as cat_id,
                    c.name as cat_name,
                    c.icon as cat_icon,
                    c.color as cat_color,
                    c.user_id as cat_user_id
                FROM passwords p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.user_id = ? AND (
                    p.title LIKE ? OR 
                    p.username LIKE ? OR 
                    p.website LIKE ? OR 
                    p.notes LIKE ? OR
                    c.name LIKE ?
                )
                ORDER BY p.title`,
                userId, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery
            );

            // Transform results to include category object
            return results.map(row => {
                const password: Password = {
                    id: row.id,
                    title: row.title,
                    username: row.username,
                    password: row.password,
                    website: row.website,
                    notes: row.notes,
                    favorite: row.favorite,
                    iv: row.iv,
                    user_id: row.user_id,
                    created_at: row.created_at,
                    updated_at: row.updated_at
                };

                // Add category if it exists
                if (row.cat_id) {
                    password.category = {
                        id: row.cat_id,
                        name: row.cat_name,
                        icon: row.cat_icon,
                        color: row.cat_color,
                        user_id: row.cat_user_id
                    };
                }

                return password;
            });
        } catch (error) {
            console.error('Error searching passwords:', error);
            throw error;
        }
    },

    update: async (password: Password): Promise<void> => {
        try {
            if (!password.id) {
                throw new Error('Password ID is required for update');
            }
            await db.runAsync(
                `UPDATE passwords SET 
                title = ?, 
                username = ?, 
                password = ?, 
                website = ?, 
                notes = ?, 
                category_id = ?,
                favorite = ?,
                iv = ?,
                updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')
                WHERE id = ?`,
                password.title,
                password.username || null,
                password.password,
                password.website || null,
                password.notes || null,
                password.category?.id || null,
                password.favorite || 0,
                password.iv,
                password.id
            );
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    },

    delete: async (id: number): Promise<void> => {
        try {
            await db.runAsync(
                'DELETE FROM passwords WHERE id = ?',
                id
            );
        } catch (error) {
            console.error('Error deleting password:', error);
            throw error;
        }
    }
};
