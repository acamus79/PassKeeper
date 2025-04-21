import React, { useState, useCallback } from 'react';
import { StyleSheet, FlatList, View, Alert } from 'react-native';
import { FAB, Searchbar, Card, IconButton, Avatar } from 'react-native-paper';
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
import { router, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

export default function PasswordsScreen() {
  const { t } = useTranslation();
  const { userId } = useAuth();
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const [searchQuery, setSearchQuery] = useState('');
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealedState, setRevealedState] = useState<{ id: number | null; value: string; copied: boolean }>({
    id: null,
    value: '',
    copied: false,
  });

  const defaultBorderColor = useThemeColor({}, 'border');

  const loadPasswords = useCallback(async () => {
    // Reset revealed state when loading/reloading passwords
    setRevealedState({ id: null, value: '', copied: false });

    if (!userId) {
      setPasswords([]);
      setLoading(false);
      return;
    }

    if (searchQuery.trim() === '') {
      setLoading(true);
    }
    setError(null);

    try {
      let userPasswords;
      if (searchQuery.trim() === '') {
        userPasswords = await PasswordService.getAllPasswords(userId);
      } else {
        userPasswords = await PasswordService.searchPasswords(userId, searchQuery);
      }
      setPasswords(userPasswords);
    } catch (err) {
      console.error('Error loading/searching passwords:', err);
      setError(t('passwords.loadError'));
      setPasswords([]);
    } finally {
      setLoading(false);
    }
  }, [userId, t, searchQuery]); // Keep dependencies

  useFocusEffect(
    useCallback(() => {
      loadPasswords(); // Call the memoized function
    }, [loadPasswords]) // Depend on the memoized loadPasswords function
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // loadPasswords is triggered by the change in searchQuery dependency in its useCallback
  };

  // Function to toggle password visibility in the card
  const handleTogglePasswordVisibility = async (id: number) => {
    if (!userId) return;

    // If this password is the one currently revealed, hide it
    if (revealedState.id === id) {
      setRevealedState({ id: null, value: '', copied: false });
      return;
    }

    // Otherwise, attempt to decrypt and reveal it
    try {
      // Get user salt
      const saltKey = `${USER_SALT_KEY_PREFIX}${userId}`;
      const salt = await SecurityUtils.secureRetrieve(saltKey);

      if (!salt) {
        console.error('User salt not found');
        Alert.alert(t('common.error'), t('errors.saltRetrievalFailed'));
        setRevealedState({ id: null, value: '', copied: false }); // Reset state on error
        return;
      }

      // Get and decrypt the password
      const decryptedPasswordData = await PasswordService.getDecryptedPassword(id, salt);

      // Update state to show the revealed password
      setRevealedState({
        id: id,
        value: decryptedPasswordData.decryptedPassword,
        copied: false, // Reset copied status when revealing a new password
      });

    } catch (error) {
      console.error('Error viewing password:', error);
      Alert.alert(t('common.error'), t('passwords.viewError'));
      setRevealedState({ id: null, value: '', copied: false }); // Reset state on error
    }
  };

  // Function to copy the revealed password
  const handleCopyRevealedPassword = async () => {
    if (!revealedState.value) return; // Don't copy if no value is revealed

    try {
      await Clipboard.setStringAsync(revealedState.value);
      setRevealedState(prev => ({ ...prev, copied: true })); // Update copied status

      // Reset copied status after a delay
      setTimeout(() => {
        // Check if the same password is still revealed before resetting copied status
        setRevealedState(prev => (prev.id === revealedState.id ? { ...prev, copied: false } : prev));
      }, 1500);

    } catch (error) {
      console.error('Error copying password to clipboard:', error);
      Alert.alert(t('common.error'), t('errors.copyFailed')); // Inform user about copy failure
    }
  };

  const renderPasswordItem = ({ item }: { item: Password }) => {
    // Determine the category display name
    const categoryDisplayName = item.category
      ? (item.category.key
        ? t(`categories.${item.category.key}`)
        : (item.category.name
          ? item.category.name
          : t('passwords.unknownCategory')))
      : t('passwords.noCategory');

    // Obtener el color de la categoría directamente. Será undefined si no existe.
    const categoryColor = item.category?.color;
    const categoryIcon = item.category?.icon;
    // Determinar si hay un estilo de categoría basado en si categoryColor tiene un valor.
    const hasCategoryStyle = !!categoryColor;
    const isRevealed = revealedState.id === item.id;

    return (
      <Card
        style={[
          styles.card,
          // Aplicar estilos específicos del borde izquierdo SOLO si hay color de categoría
          hasCategoryStyle && {
            borderLeftColor: categoryColor, // Usar el color de la categoría
            borderLeftWidth: 8,
          },
          // Si NO hay estilo de categoría, asegurar que el borde izquierdo sea delgado
          !hasCategoryStyle && {
            borderLeftWidth: 1,

            borderRightColor: defaultBorderColor,
          }
        ]}
        elevation={2}
      >
        <Card.Title
          title={item.title}
          subtitle={categoryDisplayName}
          left={(props) =>
            categoryIcon ? (
              <Avatar.Icon
                {...props}
                icon={categoryIcon}
                size={40}
                // Asegurar que el fondo del Avatar use el color correcto o un fallback
                style={{ backgroundColor: categoryColor || defaultBorderColor }}
                color="#fff"
              />
            ) : (
              <Avatar.Icon
                {...props}
                icon="folder-outline"
                size={40}
                style={{ backgroundColor: defaultBorderColor }}
                color={textColor}
              />
            )
          }
          right={(props) => (
            <View style={styles.cardActions}>
              <IconButton
                {...props}
                icon={isRevealed ? "eye-off" : "eye"}
                onPress={() => item.id !== undefined && handleTogglePasswordVisibility(item.id)}
              />
              <IconButton
                {...props}
                icon="pencil"
                onPress={() => {
                  // Navegar a la pantalla de creación/edición pasando el ID
                  if (item.id !== undefined) {
                    router.push({
                      pathname: '/passwords/create', // Ruta a la pantalla de creación/edición
                      params: { passwordId: item.id }, // Pasar el ID como parámetro
                    });
                  }
                }}
              />
            </View>
          )}
        />
        <Card.Content>
          <ThemedText>Usuario: {item.username}</ThemedText>
          {isRevealed ? (
            <>
              <View style={styles.passwordRow}>
                <ThemedText style={styles.passwordText}>Contraseña: {revealedState.value}</ThemedText>
                <IconButton
                  icon={revealedState.copied ? "check" : "content-copy"}
                  size={20}
                  onPress={handleCopyRevealedPassword}
                  disabled={revealedState.copied}
                  style={styles.copyButton}
                />
              </View>
              {item.created_at && <ThemedText>Creado: {item.created_at}</ThemedText>}
              {item.website && <ThemedText>Sitio web: {item.website}</ThemedText>}
              {item.notes && <ThemedText>Notas: {item.notes}</ThemedText>}
            </>
          ) : (
            <ThemedText>Contraseña: ********</ThemedText>
          )}
        </Card.Content>
      </Card>
    );
  };

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
    paddingBottom: 80, // Ensure space for FAB
  },
  emptyListContent: {
    flex: 1, // Ensure empty state takes full height
    justifyContent: 'center',
  },
  card: {
    marginBottom: 16,
    marginHorizontal: 5,
    //backgroundColor: '#cccccc',
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordText: {
    flex: 1, // Allow text to take available space
    marginRight: 8, // Add some space before the button
  },
  copyButton: {
    margin: 0, // Reduce default IconButton margins
  },
});
