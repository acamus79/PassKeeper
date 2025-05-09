import { openDatabaseSync } from 'expo-sqlite';
import { categoryColors } from '@constants/Colors'; // Importar los colores de categoría


const DEFAULT_USER_ID = 0; // ID para categorías del sistema
const DEFAULT_CATEGORIES = [
    { key: 'general', icon: 'shield-account', color: categoryColors.general, user_id: DEFAULT_USER_ID },
    { key: 'email', icon: 'email-lock', color: categoryColors.email, user_id: DEFAULT_USER_ID },
    { key: 'banking', icon: 'cash-lock', color: categoryColors.banking, user_id: DEFAULT_USER_ID },
    { key: 'entertainment', icon: 'youtube-subscription', color: categoryColors.entertainment, user_id: DEFAULT_USER_ID },
    { key: 'shopping', icon: 'shopping', color: categoryColors.shopping, user_id: DEFAULT_USER_ID },
    { key: 'work', icon: 'tools', color: categoryColors.work, user_id: DEFAULT_USER_ID },
    { key: 'socialMedia', icon: 'tooltip-account', color: categoryColors.socialMedia, user_id: DEFAULT_USER_ID },
];

// Create the database connection
export const db = openDatabaseSync('passkeeper.db');

// Initialize database tables
export const initDatabase = async () => {
    console.log('DATABASE.TS: iniciando la base de datos...');
    try {
        // Create users table if it doesn't exist
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                biometric INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
                updated_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime'))
            )
        `);

        // Create categories table if it doesn't exist
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT,
                name TEXT,
                icon TEXT,
                color TEXT,
                user_id INTEGER NOT NULL,
                created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
                updated_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `);

        // Create passwords table if it doesn't exist
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS passwords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                username TEXT,
                password TEXT NOT NULL,
                website TEXT,
                notes TEXT,
                category_id INTEGER,
                favorite INTEGER DEFAULT 0,
                iv TEXT,
                user_id INTEGER NOT NULL,
                created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
                updated_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
                FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `);

        // Insertar categorías por defecto si no existen
        for (const cat of DEFAULT_CATEGORIES) {
            const existing = await db.getFirstAsync(
                'SELECT id FROM categories WHERE key = ? AND user_id = ?',
                cat.key,
                cat.user_id
            );
            if (!existing) {
                // --- Start Edit 3: Ensure INSERT uses the correct properties ---
                // No change needed here structurally, but confirms it uses cat.color which now comes from categoryColors
                await db.runAsync(
                    'INSERT INTO categories (key, icon, color, user_id) VALUES (?, ?, ?, ?)',
                    cat.key,
                    cat.icon,
                    cat.color, // This 'color' now holds the value from categoryColors
                    cat.user_id
                );
                // --- End Edit 3 ---
                console.log('Categoría insertada:', cat.key);
            }
        }
        return true;
    } catch (error) {
        console.error('Error initializing database tables:', error);
        return false;
    }
};

// Añadir una función para borrar y reinicializar la base de datos
export const resetDatabase = async () => {
    try {
        console.log('Borrando base de datos...');

        // Eliminar todas las tablas existentes
        await db.execAsync(`
            PRAGMA writable_schema = 1;
            DELETE FROM sqlite_master WHERE type in ('table', 'index', 'trigger');
            PRAGMA writable_schema = 0;
            VACUUM;
        `);

        console.log('Base de datos borrada correctamente');

        // Reinicializar la base de datos
        await initDatabase();

        console.log('Base de datos reinicializada correctamente');

        return true;
    } catch (error) {
        console.error('Error al resetear la base de datos:', error);
        return false;
    }
};
