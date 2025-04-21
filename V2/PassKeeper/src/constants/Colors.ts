const tintColorLight = '#2196F3';
const tintColorDark = '#4DABF5';

export default {
    light: {
        text: '#000000',
        background: '#F5F5F5',
        tint: tintColorLight,
        tabIconDefault: '#ccc',
        tabIconSelected: tintColorLight,
        surface: '#FFFFFF',
        error: '#B00020',
        success: '#4CAF50',
        warning: '#FFC107',
        info: '#2196F3',
        border: '#D1D1D1', // Color de borde para tema claro
    },
    dark: {
        text: '#FFFFFF',
        background: '#121212',
        tint: tintColorDark,
        tabIconDefault: '#666',
        tabIconSelected: tintColorDark,
        surface: '#1E1E1E',
        error: '#CF6679',
        success: '#4CAF50',
        warning: '#FFC107',
        info: '#2196F3',
        border: '#444444',
    },
};
