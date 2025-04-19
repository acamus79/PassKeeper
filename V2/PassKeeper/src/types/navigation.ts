import 'expo-router';

// Declara las rutas de tu aplicación
declare module 'expo-router' {
    interface AppRoutes {
        '/': {};
        'passwords': {};
        'categories': {};
        'settings': {};
        'register': {};
        'forgot-password': {};
        // Añade aquí más rutas según sea necesario
    }
}
