import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AuthService } from '../services/AuthService';

// Definimos la forma de nuestro contexto
interface AuthContextType {
    isAuthenticated: boolean;
    userId: number | null;
    username: string | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshAuthState: () => Promise<void>;
}

// Creamos el contexto con un valor predeterminado
const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    userId: null,
    username: null,
    loading: true,
    login: async () => false,
    logout: async () => { },
    refreshAuthState: async () => { },
});

// Props para el componente AuthProvider
interface AuthProviderProps {
    children: ReactNode;
}

// Componente Provider que envuelve tu app y hace que el objeto auth esté disponible para cualquier componente hijo
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Función para refrescar el estado de autenticación
    const refreshAuthState = async () => {
        try {
            setLoading(true);
            const loggedIn = await AuthService.isLoggedIn();
            setIsAuthenticated(loggedIn);

            if (loggedIn) {
                const currentUserId = await AuthService.getCurrentUserId();
                const currentUsername = await AuthService.getCurrentUsername();
                setUserId(currentUserId);
                setUsername(currentUsername);
            } else {
                setUserId(null);
                setUsername(null);
            }
        } catch (error) {
            console.error('Error al refrescar el estado de autenticación:', error);
            setIsAuthenticated(false);
            setUserId(null);
            setUsername(null);
        } finally {
            setLoading(false);
        }
    };

    // Verificar el estado de autenticación cuando la app se carga
    useEffect(() => {
        refreshAuthState();
    }, []);

    // Función de inicio de sesión
    const login = async (username: string, password: string): Promise<boolean> => {
        const success = await AuthService.login(username, password);
        if (success) {
            await refreshAuthState();
        }
        return success;
    };

    // Función de cierre de sesión
    const logout = async (): Promise<void> => {
        await AuthService.logout();
        setIsAuthenticated(false);
        setUserId(null);
        setUsername(null);
    };

    // El valor que estará disponible para los componentes consumidores
    const value = {
        isAuthenticated,
        userId,
        username,
        loading,
        login,
        logout,
        refreshAuthState,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => useContext(AuthContext);
