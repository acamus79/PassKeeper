
export default {
    light: {
        primary: '#0A6CB5',
        onPrimary: '#FFFFFF', // Texto blanco sobre primario claro
        background: '#F5F5F5',
        onBackground: '#000000', // Texto negro sobre fondo claro
        surface: '#FFFFFF',
        onSurface: '#000000', // Texto negro sobre superficie clara
        surfaceVariant: '#EEEEEE', // Variante ligeramente más oscura que surface
        onSurfaceVariant: '#424242', // Texto oscuro sobre surfaceVariant
        outline: '#D1D1D1',
        surfaceDisabled: 'rgba(0, 0, 0, 0.12)', // Superficie deshabilitada (negro con baja opacidad)
        onSurfaceDisabled: 'rgba(0, 0, 0, 0.38)', // Texto deshabilitado (negro con opacidad media)
        error: '#FF5252',
        onError: '#FFFFFF', // Texto blanco sobre error claro
        // Mantener tus colores específicos si los usas directamente
        text: '#000000', // Tu clave original 'text'
        tint: '#0A6CB5', // Tu clave original 'tint'
        tabIconDefault: '#ccc',
        tabIconSelected: '#0A6CB5',
        success: '#4CAF50',
        warning: '#FFC107',
        info: '#2196F3',
        border: '#D1D1D1', // Tu clave original 'border'
    },
    dark: {
        primary: '#4DABF5',
        onPrimary: '#000000', // Texto negro sobre primario oscuro (que es claro)
        background: '#121212',
        onBackground: '#FFFFFF', // Texto blanco sobre fondo oscuro
        surface: '#2C2C2C',
        onSurface: '#FFFFFF', // Texto blanco sobre superficie oscura
        surfaceVariant: '#3A3A3A', // Variante ligeramente más clara que surfaceDark
        onSurfaceVariant: '#BDBDBD', // Texto claro sobre surfaceVariant oscura
        outline: '#666',
        surfaceDisabled: 'rgba(255, 255, 255, 0.12)', // Superficie deshabilitada (blanco con baja opacidad)
        onSurfaceDisabled: 'rgba(255, 255, 255, 0.705)', // Texto deshabilitado (blanco con opacidad media)
        error: '#CF6679',
        onError: '#000000', // Texto negro sobre error oscuro (que es claro)
        text: '#FFF9',
        tint: '#4DABF5', // Tu clave original 'tint'
        tabIconDefault: '#999',
        tabIconSelected: '#4DABF5',
        success: '#7EB900', // Mantener el mismo success? O buscar variante oscura?
        warning: '#FFC107', // Mantener el mismo warning?
        info: '#2196F3', // Mantener el mismo info?
        border: '#666', // Tu clave original 'border'
    },
};

// Colores específicos para las categorías por defecto, con tonalidades apagadas/desaturadas
export const categoryColors = {
    general: '#778899',       // LightSlateGray (Gris pizarra claro)
    socialMedia: '#C71585',
    email: '#CD4C2C',         // IndianRed (Rojo indio)
    banking: '#02A5A5',
    shopping: '#FFD700',      // Gold (Amarillo dorado)
    entertainment: '#414EA5',
    work: '#1D83AB',
};

