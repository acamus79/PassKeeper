import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, View } from 'react-native';
import { FAB, Searchbar, Card, IconButton } from 'react-native-paper';
import { ThemedView } from '@components/ui/ThemedView';
import { ThemedText } from '@components/ui/ThemedText';
import useThemeColor from '@hooks/useThemeColor';
import useTranslation from '@hooks/useTranslation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@contexts/AuthContext';
import { PasswordService } from '@services/PasswordService';
import { Password } from '@app-types/entities';
import { SecurityUtils } from '@utils/SecurityUtils';
import { USER_SALT_KEY_PREFIX } from '@constants/secureStorage';
import { router } from 'expo-router';

export default function PasswordsScreen() {
  const { t } = useTranslation();
  const { userId } = useAuth();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const [searchQuery, setSearchQuery] = useState('');
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar contraseñas reales del usuario
  useEffect(() => {
    const loadPasswords = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Obtener las contraseñas del usuario actual
        const userPasswords = await PasswordService.getAllPasswords(userId);
        setPasswords(userPasswords);
        setError(null);
      } catch (error) {
        console.error('Error loading passwords:', error);
        setError(t('passwords.loadError'));
      } finally {
        setLoading(false);
      }
    };

    loadPasswords();
  }, [userId, t]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!userId) return;

    try {
      setLoading(true);

      if (query.trim() === '') {
        // Cargar todas las contraseñas si la búsqueda está vacía
        const allPasswords = await PasswordService.getAllPasswords(userId);
        setPasswords(allPasswords);
      } else {
        // Implementar búsqueda en el repositorio
        // Nota: Asumiendo que hay un método search en PasswordRepository
        // Si no existe, deberías implementarlo o hacer la búsqueda localmente
        const filteredPasswords = await PasswordService.searchPasswords(userId, query);
        setPasswords(filteredPasswords);
      }
    } catch (error) {
      console.error('Error searching passwords:', error);
      setError(t('passwords.searchError'));
    } finally {
      setLoading(false);
    }
  };

  // Función para ver la contraseña descifrada
  const handleViewPassword = async (id: number) => {
    if (!userId) return;

    try {
      // Obtener el salt del usuario
      const saltKey = `${USER_SALT_KEY_PREFIX}${userId}`;
      const salt = await SecurityUtils.secureRetrieve(saltKey);

      if (!salt) {
        console.error('User salt not found');
        return;
      }

      // Obtener y descifrar la contraseña
      const decryptedPassword = await PasswordService.getDecryptedPassword(id, salt);

      // Aquí puedes mostrar la contraseña en un modal o alert
      // Por ahora solo la mostramos en consola
      console.log('Contraseña descifrada:', decryptedPassword.decryptedPassword);

      // TODO: Implementar un modal para mostrar la contraseña
    } catch (error) {
      console.error('Error viewing password:', error);
    }
  };

  const renderPasswordItem = ({ item }: { item: Password }) => (
    <Card style={styles.card} mode="outlined">
      <Card.Title
        title={item.title}
        subtitle={item.category?.name || t('passwords.noCategory')}
        right={(props) => (
          <View style={styles.cardActions}>
            <IconButton 
              {...props} 
              icon="eye" 
              onPress={() => item.id !== undefined && handleViewPassword(item.id)} 
            />
            <IconButton {...props} icon="pencil" onPress={() => {/* TODO: Implementar edición */ }} />
          </View>
        )}
      />
      <Card.Content>
        <ThemedText>Usuario: {item.username}</ThemedText>
        <ThemedText>Contraseña: ********</ThemedText>
        {item.notes && <ThemedText>Notas: {item.notes}</ThemedText>}
      </Card.Content>
    </Card>
  );

  // Componente para mostrar cuando no hay contraseñas
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="lock-outline" size={80} color={textColor} style={styles.emptyIcon} />
      <ThemedText style={styles.emptyTitle}>{t('passwords.noPasswordsTitle')}</ThemedText>
      <ThemedText style={styles.emptyText}>{t('passwords.noPasswordsDescription')}</ThemedText>
    </View>
  );

  // Componente para mostrar cuando hay un error
  const ErrorState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="alert-circle-outline" size={80} color={textColor} style={styles.emptyIcon} />
      <ThemedText style={styles.emptyTitle}>{t('common.error')}</ThemedText>
      <ThemedText style={styles.emptyText}>{error}</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Searchbar
        placeholder={t('common.search')}
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      {loading ? (
        <View style={styles.emptyContainer}>
          <ThemedText>{t('common.loading')}</ThemedText>
        </View>
      ) : error ? (
        <ErrorState />
      ) : (
        <FlatList
          data={passwords}
          renderItem={renderPasswordItem}
          keyExtractor={(item) => item.id?.toString() || ''}
          contentContainerStyle={[
            styles.listContent,
            passwords.length === 0 && styles.emptyListContent
          ]}
          ListEmptyComponent={EmptyState}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: tintColor }]}
        onPress={() => router.push('/passwords/create')}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
