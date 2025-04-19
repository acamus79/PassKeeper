import { initDatabase } from '../database/database';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { SecurityUtils } from '../utils/SecurityUtils';

// Exportamos los servicios
export * from './PasswordService';

// Constantes para categorías predeterminadas
const DEFAULT_USER_ID = 0; // ID para categorías del sistema
const DEFAULT_CATEGORIES = [
    { name: 'Social Media', icon: 'social-media', color: '#3b5998', user_id: DEFAULT_USER_ID },
    { name: 'Email', icon: 'email', color: '#d44638', user_id: DEFAULT_USER_ID },
    { name: 'Banking', icon: 'bank', color: '#006400', user_id: DEFAULT_USER_ID },
    { name: 'Shopping', icon: 'shopping', color: '#ff9900', user_id: DEFAULT_USER_ID },
    { name: 'Entertainment', icon: 'entertainment', color: '#e50914', user_id: DEFAULT_USER_ID },
    { name: 'Work', icon: 'work', color: '#0077b5', user_id: DEFAULT_USER_ID },
];

export const initializeApp = async () => {
    try {
        // Initialize database tables
        await initDatabase();
        console.log('Starting database initialization...');
        
        // Create default categories if needed
        await createDefaultCategories();
        console.log('Database initialization completed successfully');
        return true;
    } catch (error) {
        console.error('Error initializing app:', error);
        return false;
    }
};

const createDefaultCategories = async () => {
    try {
        // Check if categories already exist
        const existingCategories = await CategoryRepository.findAll();
        
        // If no categories exist, create default ones
        if (existingCategories.length === 0) {
            console.log('Creating default categories...');
            
            // Crear todas las categorías en una sola operación
            await Promise.all(
                DEFAULT_CATEGORIES.map(category => 
                    CategoryRepository.create(category)
                )
            );
            
            console.log('Default categories created successfully');
        } else {
            console.log('Categories already exist, skipping default creation');
        }
    } catch (error) {
        console.error('Error creating default categories:', error);
        throw error;
    }
};

/**
 * Genera un salt para un nuevo usuario
 */
export const generateUserSalt = async (): Promise<string> => {
    try {
        return await SecurityUtils.generateSalt();
    } catch (error) {
        console.error('Error generating user salt:', error);
        throw new Error('Error al generar el salt del usuario');
    }
};
