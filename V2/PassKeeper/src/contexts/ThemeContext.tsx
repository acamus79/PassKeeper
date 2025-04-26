import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type ThemeType = 'light' | 'dark';
type ThemePreference = 'system' | ThemeType;

interface ThemeContextType {
    theme: ThemeType;
    themePreference: ThemePreference;
    setThemePreference: (preference: ThemePreference) => Promise<void>;
    toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    themePreference: 'system',
    setThemePreference: async () => { },
    toggleTheme: async () => { },
});

interface ThemeProviderProps {
    children: ReactNode;
}

const THEME_PREFERENCE_KEY = 'theme_preference';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const systemTheme = useSystemColorScheme() as ThemeType || 'light';
    const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
    const [theme, setTheme] = useState<ThemeType>(systemTheme);

    // Cargar la preferencia de tema guardada
    useEffect(() => {
        const loadThemePreference = async () => {
            try {
                const savedPreference = await SecureStore.getItemAsync(THEME_PREFERENCE_KEY);
                if (savedPreference) {
                    setThemePreferenceState(savedPreference as ThemePreference);
                }
            } catch (error) {
                console.error('Error loading theme preference:', error);
            }
        };

        loadThemePreference();
    }, []);

    // Actualizar el tema cuando cambia la preferencia o el tema del sistema
    useEffect(() => {
        if (themePreference === 'system') {
            setTheme(systemTheme);
        } else {
            setTheme(themePreference);
        }
    }, [themePreference, systemTheme]);

    // Guardar la preferencia de tema
    const setThemePreference = async (preference: ThemePreference) => {
        try {
            await SecureStore.setItemAsync(THEME_PREFERENCE_KEY, preference);
            setThemePreferenceState(preference);
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    };

    // Alternar entre temas
    const toggleTheme = async () => {
        const newPreference: ThemePreference = theme === 'light' ? 'dark' : 'light';
        await setThemePreference(newPreference);
    };

    return (
        <ThemeContext.Provider
            value={{
                theme,
                themePreference,
                setThemePreference,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
