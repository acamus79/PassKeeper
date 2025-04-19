import { openDatabaseSync } from 'expo-sqlite';

// Create the database connection
export const db = openDatabaseSync('passkeeper.db');

// Initialize database tables
// Actualizar la creación de la tabla users
export const initDatabase = async () => {
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
                name TEXT NOT NULL,
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

        console.log('Database tables initialized successfully');
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
