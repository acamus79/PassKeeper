import { useTheme } from '../contexts/ThemeContext';

// Este hook ahora devuelve el tema del contexto en lugar del tema del sistema
export default function useColorScheme(): 'light' | 'dark' {
    const { theme } = useTheme();
    return theme;
}
