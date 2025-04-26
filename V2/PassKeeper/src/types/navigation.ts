import 'expo-router';

// Declara las rutas de tu aplicación
declare module 'expo-router' {
    interface AppRoutes {
        '/': {};
        'passwords': {};
        'categories': {};
        'settings': {};
        'register': {};
        // Añade aquí más rutas según sea necesario
    }
}
