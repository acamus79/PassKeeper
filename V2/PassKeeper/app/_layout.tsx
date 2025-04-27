import React, { useEffect } from 'react';
import 'src/types/navigation';
import { View, TouchableWithoutFeedback, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Slot, useRouter, useSegments } from "expo-router";
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import useColorScheme from '@hooks/useColorScheme';
import Colors from '@constants/Colors'; // Asegúrate que la importación sea del default export
import { initDatabase } from '@database/database';
import { AuthProvider, useAuth } from '@contexts/AuthContext';
import useActivityTracker from '@hooks/useActivityTracker';
import { ThemeProvider } from '../src/contexts/ThemeContext';

// Componente para manejar la protección de rutas a nivel global
function ProtectedLayout({ colorScheme }: { colorScheme: 'light' | 'dark' }) {
  console.log('PUNTO DE INGRESO GENERAL:');
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // Usar el hook para rastrear la actividad del usuario
  const { updateActivity } = useActivityTracker();

  // Agregar logs para depuración
  useEffect(() => {
    console.log('PUNTO DE INGRESO GENERAL: Estado de autenticacion:', { isAuthenticated, loading, segments });
  }, [isAuthenticated, loading, segments]);

  useEffect(() => {
    if (!loading) {
      const inPublicGroup = segments[0] === '(public)';
      // Si no está autenticado y no está en el grupo público, redirigir al login
      if (!isAuthenticated && !inPublicGroup) {
        console.log('Redirecting to login...');
        router.replace({
          pathname: '/(public)'
        });
      } else if (isAuthenticated && inPublicGroup) {
        // Si está autenticado y está en el grupo público, redirigir al dashboard
        console.log('Redirecting to dashboard...');
        router.replace({
          pathname: '/(protected)/passwords'
        });
      }
    }
  }, [isAuthenticated, loading, segments]);

  // Envolver el contenido en un TouchableWithoutFeedback para detectar interacciones
  return (
    <TouchableWithoutFeedback onPress={updateActivity}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Configurar StatusBar para que sea translúcida y respete el área segura */}
        <StatusBar
          translucent={true}
          backgroundColor="transparent"
          barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        />
        {/* Agregar un espacio superior para dispositivos Android que no respetan SafeAreaView */}
        {Platform.OS === 'android' && <View style={{ height: StatusBar.currentHeight || 0 }} />}
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const setupApp = async () => {
      try {
        // Inicializar la base de datos normalmente
        await initDatabase();
        console.log('PUNTO DE INGRESO: setupApp base de datos inicializada');
        // Verificar datos de sesión en SecureStore
        //const userId = await SecureStore.getItemAsync('session_user_id');
        //const username = await SecureStore.getItemAsync('session_username');

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
        ...Colors.dark,
      }
    }
    : {
      ...MD3LightTheme,
      colors: {
        ...MD3LightTheme.colors,
        ...Colors.light,
      }
    };

  return (
    <ThemeProvider>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <ProtectedLayout colorScheme={colorScheme} />
        </PaperProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

