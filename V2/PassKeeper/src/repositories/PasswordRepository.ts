import { db } from '../database/database';
import { Password } from '../types/entities';
import { executeWithRetry, executeInTransaction } from '../utils/DatabaseUtils';

export const PasswordRepository = {
    create: async (password: Omit<Password, 'id' | 'created_at' | 'updated_at'> & { category_id?: number }): Promise<number> => {
        try {
            // Usar transacción para garantizar que la operación se complete o se revierta completamente
            return await executeInTransaction(async () => {
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
            });
        } catch (error) {
            console.error('Error creating password:', error);
            throw new Error('Failed to create password');
        }
    },

    findByUserId: async (userId: number): Promise<Password[]> => {
        try {
            // Usar executeWithRetry para manejar posibles bloqueos de base de datos
            const results = await executeWithRetry(async () => {
                return await db.getAllAsync<any>(
                    `SELECT
                        p.*,
                        c.id as cat_id,
                        c.key as cat_key,
                        c.name as cat_name,
                        c.icon as cat_icon,
                        c.color as cat_color,
                        c.user_id as cat_user_id
                    FROM passwords p
                    LEFT JOIN categories c ON p.category_id = c.id
                    WHERE p.user_id = ?
                    ORDER BY p.updated_at DESC, p.title`,
                    userId
                );
            });

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
                        key: row.cat_key,
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
            // Usar executeWithRetry para manejar posibles bloqueos de base de datos
            const result = await executeWithRetry(async () => {
                return await db.getFirstAsync<any>(
                    `SELECT 
                        p.*,
                    c.id as cat_id,
                    c.name as cat_name,
                    c.icon as cat_icon,
                    c.color as cat_color,
                    c.user_id as cat_user_id
                    FROM passwords p
                    LEFT JOIN categories c ON p.category_id = c.id
                    WHERE p.id = ? `,
                    id
                );
            });

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
            // Usar executeWithRetry para manejar posibles bloqueos de base de datos
            const results = await executeWithRetry(async () => {
                return await db.getAllAsync<any>(
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
                    ORDER BY p.updated_at DESC, p.title`,
                    categoryId
                );
            });

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
            const searchQuery = `% ${query} % `;
            // Usar executeWithRetry para manejar posibles bloqueos de base de datos
            const results = await executeWithRetry(async () => {
                return await db.getAllAsync<any>(
                    `SELECT 
                        p.*,
                    c.id as cat_id,
                    c.name as cat_name,
                    c.icon as cat_icon,
                    c.color as cat_color,
                    c.user_id as cat_user_id
                    FROM passwords p
                    LEFT JOIN categories c ON p.category_id = c.id
                    WHERE p.user_id = ? AND(
                        p.title LIKE ? OR 
                        p.username LIKE ? OR 
                        p.website LIKE ? OR 
                        p.notes LIKE ? OR
                        c.name LIKE ?
                    )
                    ORDER BY p.updated_at DESC, p.title`,
                    userId, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery
                );
            });

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

    /**
     * Updates specific columns for a password entry identified by its ID.
     * Assumes data contains column names and values ready for the DB.
     * Always updates the updated_at timestamp.
     * @param id The ID of the password to update.
     * @param dataToUpdate An object where keys are column names and values are the new values.
     */
    update: async (id: number, dataToUpdate: { [column: string]: string | number | null }): Promise<void> => {
        try {
            // Usar transacción para garantizar que la operación se complete o se revierta completamente
            await executeInTransaction(async () => {
                const columns = Object.keys(dataToUpdate);

                // If no specific columns are provided to update, do nothing.
                if (columns.length === 0) {
                    console.warn(`PasswordRepository.update called for id ${id} with no data to update.`);
                    return;
                }

                // Construct the SET clauses dynamically from the provided data
                const setClauses = columns.map(col => `${col} = ?`);
                const values = Object.values(dataToUpdate);

                // Always add the updated_at timestamp
                setClauses.push("updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')");

                // Construct the final SQL query
                const sql = `UPDATE passwords SET ${setClauses.join(', ')} WHERE id = ? `;
                values.push(id); // Add the id for the WHERE clause

                // Execute the query
                console.log('Executing SQL:', sql);
                console.log('With values:', values);
                await db.runAsync(sql, ...values);
            });
        } catch (error) {
            console.error(`Error updating password with id ${id}: `, error);
            throw new Error(`Failed to update password with id ${id} `);
        }
    },

    delete: async (id: number): Promise<void> => {
        try {
            // Usar transacción para garantizar que la operación se complete o se revierta completamente
            await executeInTransaction(async () => {
                await db.runAsync(
                    'DELETE FROM passwords WHERE id = ?',
                    id
                );
            });
        } catch (error) {
            console.error('Error deleting password:', error);
            throw new Error(`Failed to delete password with id ${id} `);
        }
    }
};
