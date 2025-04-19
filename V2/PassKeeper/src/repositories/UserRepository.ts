import { db } from '../database/database';
import { User } from '../types/entities';

// Añadir métodos para gestionar la configuración de auto-lock
export const UserRepository = {
    create: async (user: Omit<User, 'id'>): Promise<number> => {
        try {
            const result = await db.runAsync(
                `INSERT INTO users (username, password, biometric) 
                VALUES (?, ?, ?)`,
                user.username,
                user.password,
                user.biometric || 0
            );
            console.log('User created with ID:', result.lastInsertRowId);
            return result.lastInsertRowId;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    findByEmail: async (email: string): Promise<User | null> => {
        try {
            return await db.getFirstAsync<User>(
                'SELECT * FROM users WHERE email = ?',
                email
            );
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    },

    findByUsername: async (username: string): Promise<User | null> => {
        try {
            return await db.getFirstAsync<User>(
                'SELECT * FROM users WHERE username = ?',
                username
            );
        } catch (error) {
            console.error('Error finding user by username:', error);
            throw error;
        }
    },

    findById: async (id: number): Promise<User | null> => {
        try {
            return await db.getFirstAsync<User>(
                'SELECT * FROM users WHERE id = ?',
                id
            );
        } catch (error) {
            console.error('Error finding user by id:', error);
            throw error;
        }
    },

    update: async (user: User): Promise<void> => {
        try {
            if (!user.id) {
                throw new Error('User ID is required for update');
            }

            await db.runAsync(
                `UPDATE users SET 
                username = ?, 
                password = ?, 
                biometric = ?,
                updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime') 
                WHERE id = ?`,
                user.username,
                user.password,
                user.biometric || 0,
                user.id
            );
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    // Add a method to update just the biometric setting
    updateBiometric: async (userId: number, biometric: number): Promise<void> => {
        try {
            await db.runAsync(
                `UPDATE users SET 
                biometric = ?,
                updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime') 
                WHERE id = ?`,
                biometric,
                userId
            );
        } catch (error) {
            console.error('Error updating biometric setting:', error);
            throw error;
        }
    },

    delete: async (id: number): Promise<void> => {
        try {
            await db.runAsync('DELETE FROM users WHERE id =?', id);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
};
