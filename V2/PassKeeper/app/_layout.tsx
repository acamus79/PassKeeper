import React, { useEffect } from 'react';
import 'src/types/navigation';
import { View, TouchableWithoutFeedback } from 'react-native';
import { Slot, useRouter, useSegments } from "expo-router";
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import useColorScheme from '@hooks/useColorScheme';
import Colors from '@constants/Colors';
import { initDatabase } from '@database/database';
import { AuthProvider, useAuth } from '@contexts/AuthContext';
import useActivityTracker from '@hooks/useActivityTracker';
import * as SecureStore from 'expo-secure-store';
import { ThemeProvider } from '../src/contexts/ThemeContext';

// Componente para manejar la protección de rutas a nivel global
function ProtectedLayout() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // Usar el hook para rastrear la actividad del usuario
  const { updateActivity } = useActivityTracker();

  // Agregar logs para depuración
  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, loading, segments });
  }, [isAuthenticated, loading, segments]);

  useEffect(() => {
    if (!loading) {
      const inPublicGroup = segments[0] === '(public)';
      // Si no está autenticado y no está en el grupo público, redirigir al login
      if (!isAuthenticated && !inPublicGroup) {
        router.replace({
          pathname: '/(public)'
        });
      } else if (isAuthenticated && inPublicGroup) {
        router.replace({
          pathname: '/(protected)/passwords'
        });
      }
    }
  }, [isAuthenticated, loading, segments]);

  // Envolver el contenido en un TouchableWithoutFeedback para detectar interacciones
  return (
    <TouchableWithoutFeedback onPress={updateActivity}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </TouchableWithoutFeedback>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const setupApp = async () => {
      try {
        console.log('Initializing database...');
        // Inicializar la base de datos normalmente
        await initDatabase();
        // Verificar datos de sesión en SecureStore
        const userId = await SecureStore.getItemAsync('session_user_id');
        const username = await SecureStore.getItemAsync('session_username');
        console.log('Datos de sesión encontrados:', { userId, username });

      } catch (error) {
        console.error('Error during app initialization:', error);
      }
    };

    setupApp();
  }, []);

  const theme = colorScheme === 'dark'
    ? {
      ...MD3DarkTheme,
      colors: {
        ...MD3DarkTheme.colors,
        primary: Colors.dark.tint
      }
    }
    : {
      ...MD3LightTheme,
      colors: {
        ...MD3LightTheme.colors,
        primary: Colors.light.tint
      }
    };

  return (
    <ThemeProvider>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <ProtectedLayout />
        </PaperProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

