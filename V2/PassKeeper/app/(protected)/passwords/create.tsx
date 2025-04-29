import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import { TextInput, Button, IconButton, Menu } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { ThemedView } from '@components/ui/ThemedView';
import { ThemedText } from '@components/ui/ThemedText';
import useThemeColor from '@hooks/useThemeColor';
import useTranslation from '@hooks/useTranslation';
import { SecurityUtils } from '@utils/SecurityUtils';
import { CategoryService } from '@services/CategoryService';
import { PasswordService } from '@services/PasswordService';
import { useAuth } from '@contexts/AuthContext';
import { Category } from '@app-types/entities';
import { USER_SALT_KEY_PREFIX } from '@constants/secureStorage';

export default function CreatePasswordScreen() {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { userId } = useAuth();
    const tintColor = useThemeColor({}, 'tint');
    const params = useLocalSearchParams<{ passwordId?: string }>();
    const passwordId = params.passwordId ? parseInt(params.passwordId, 10) : null;
    const isEditMode = passwordId !== null;

    // Establecer el título dinámicamente basado en el modo
    useEffect(() => {
        navigation.setOptions({
            title: isEditMode ? t('passwords.editPassword') : t('passwords.createNew')
        });
    }, [navigation, isEditMode, t]);

    // Estados para los campos del formulario
    const [title, setTitle] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    // State to store the original password fetched in edit mode
    const [originalPassword, setOriginalPassword] = useState<string | null>(null);
    const [website, setWebsite] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    // Estados para la UI
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [menuVisible, setMenuVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // For save/update operation
    const [isLoadingData, setIsLoadingData] = useState(isEditMode); // For loading data in edit mode
    const [categories, setCategories] = useState<Category[]>([]);

    // Cargar categorías (se ejecuta siempre)
    useEffect(() => {
        const loadCategories = async () => {
            if (!userId) return;
            try {
                const userCategories = await CategoryService.getUserCategories(userId);
                setCategories(userCategories);

                // Set default category ONLY in CREATE mode after categories are loaded
                if (!isEditMode && userCategories.length > 0) {
                    // Find the 'general' category (assuming it has the key 'general')
                    const generalCategory = userCategories.find(cat => cat.key === 'general');
                    if (generalCategory) {
                        setSelectedCategory(generalCategory);
                    } else {
                        console.warn("Default 'general' category not found.");
                    }
                }
                // En modo EDITAR, la categoría será establecida por el efecto loadPasswordData
            } catch (error) {
                console.error('Error loading categories:', error);
                Alert.alert(t('common.error'), t('categories.loadError'));
            }
        };

        loadCategories();
    }, [userId, t, isEditMode]);

    // Cargar datos de la contraseña si estamos en modo edición
    useEffect(() => {
        const loadPasswordData = async () => {
            // Espera hasta que estemos en modo edición, tengamos userId, passwordId, Y las categorías se hayan cargado
            if (!isEditMode || !userId || !passwordId || categories.length === 0) {
                if (isEditMode && categories.length === 0) {
                    setIsLoadingData(true);
                } else {
                    setIsLoadingData(false);
                }
                return;
            }

            setIsLoadingData(true);
            try {
                // 1. Get user salt
                const saltKey = `${USER_SALT_KEY_PREFIX}${userId}`;
                const userSalt = await SecurityUtils.secureRetrieve(saltKey);
                if (!userSalt) {
                    throw new Error(t('errors.saltRetrievalFailed'));
                }
                const passwordData = await PasswordService.getDecryptedPassword(passwordId, userSalt);

                // Rellenar el estado del formulario (título, nombre de usuario, contraseña, etc.)
                setTitle(passwordData.title);
                setUsername(passwordData.username || '');
                setPassword(passwordData.decryptedPassword);
                setOriginalPassword(passwordData.decryptedPassword);
                setWebsite(passwordData.website || '');
                setNotes(passwordData.notes || '');

                // Buscar y establecer la categoría usando el objeto categoría anidado
                if (passwordData.category) { // Check if category object exists
                    // Encuentra la categoría en la lista cargada usando el ID del objeto anidado
                    const category = categories.find(cat => cat.id === passwordData.category?.id); // Use optional chaining for safe access
                    if (category) {
                        setSelectedCategory(category); // Establecer la categoría específica para la contraseña
                    } else {
                        // Este caso puede ocurrir si las categorías no se han cargado todavía, o si la categoría ha sido eliminada.
                        console.warn('(Edit Mode) Category object existed in password data, but not found in loaded categories list for ID:', passwordData.category.id);
                        setSelectedCategory(null);
                    }
                } else {
                    // Manejar el caso en que la contraseña en la DB podría no tener una categoría asignada
                    console.warn('(Edit Mode) Password data does not have a category object associated.');
                    setSelectedCategory(null);
                }

            } catch (error) {
                console.error('Error loading password data:', error);
                Alert.alert(t('common.error'), t('passwords.loadError'));
                router.back();
            } finally {
                setIsLoadingData(false);
            }
        };

        loadPasswordData();
    }, [isEditMode, passwordId, userId, t, categories]);

    // Generar contraseña aleatoria
    const generateRandomPassword = async () => {
        try {
            const randomPassword = await SecurityUtils.generateRandomPassword(12);
            setPassword(randomPassword);
        } catch (error) {
            console.error('Error generating random password:', error);
            Alert.alert(t('common.error'), t('passwords.generatePasswordError'));
        }
    };

    const handleSave = async () => {

        // Validar campos
        if (!title.trim() || !password.trim() || !selectedCategory || !userId) {
            Alert.alert(t('common.error'), t('passwords.valueRequired'));
            return;
        }

        // Comprobar explícitamente si la categoría seleccionada tiene un ID numérico válido
        // Esto es necesario porque el Category.id puede ser opcional o indefinido
        if (typeof selectedCategory.id !== 'number') {
            console.error("Selected category is missing a valid numeric ID:", selectedCategory);
            Alert.alert(t('common.error'), t('passwords.invalidCategorySelected', 'Invalid category selected. Cannot save.'));
            return;
        }
        const categoryId: number = selectedCategory.id;

        try {
            setIsLoading(true);

            // Obtener sal de usuario (necesaria tanto para crear como para actualizar)
            const saltKey = `${USER_SALT_KEY_PREFIX}${userId}`;
            const userSalt = await SecurityUtils.secureRetrieve(saltKey);
            if (!userSalt) {
                throw new Error(t('errors.saltRetrievalFailed'));
            }

            // Construir el objeto de datos de la contraseña principal utilizando el categoryId validado
            const passwordData = {
                title,
                username,
                website,
                notes,
                category_id: categoryId,
                favorite: 0,
                user_id: userId,
            };

            if (isEditMode && passwordId) {
                const passwordChanged = password !== originalPassword;
                await PasswordService.updatePassword(
                    passwordId,
                    passwordData,
                    passwordChanged ? password : null,
                    userSalt
                );
                Alert.alert(
                    t('common.success'),
                    t('passwords.passwordUpdated'),
                    [{
                        text: t('common.ok'), onPress: () => {
                            router.back();
                        }
                    }]
                );
            } else {
                await PasswordService.createPassword(
                    passwordData,
                    password,
                    userSalt
                );
                Alert.alert(
                    t('common.success'),
                    t('passwords.passwordSaved'),
                    [{
                        text: t('common.ok'), onPress: () => {
                            router.back();
                        }
                    }]
                );
            }

        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'saving'} password (in catch block):`, error);
            Alert.alert(t('common.error'), isEditMode ? t('passwords.updatingError') : t('passwords.savingError'));
        } finally {
            setIsLoading(false);
        }
    };

    // Mostrar indicador de carga mientras se obtienen datos
    if (isLoadingData) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={tintColor} />
                <ThemedText>{t('common.loading')}</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TextInput
                    label={t('passwords.name')}
                    value={title}
                    onChangeText={setTitle}
                    style={styles.input}
                    mode="outlined"
                    theme={{ colors: { primary: tintColor } }}
                />

                <View style={styles.categoryContainer}>
                    <Menu
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={
                            <TextInput
                                label={t('passwords.category')}
                                value={
                                    selectedCategory
                                        ? (selectedCategory.key
                                            ? t(`categories.${selectedCategory.key}`)
                                            : selectedCategory.name) ?? '' // Me aseguro que sea un string
                                        : ''
                                }
                                style={styles.input}
                                mode="outlined"
                                editable={false}
                                theme={{ colors: { primary: tintColor } }}
                                right={
                                    <TextInput.Icon
                                        icon="menu-down"
                                        onPress={() => setMenuVisible(true)}
                                    />
                                }
                            />
                        }
                        style={styles.menu}
                    >
                        {categories.length === 0 ? (
                            <Menu.Item title={t('categories.noCategories')} disabled />
                        ) : (
                            categories.map((category) => (
                                <Menu.Item
                                    key={category.id?.toString() || ''}
                                    onPress={() => {
                                        setSelectedCategory(category);
                                        setMenuVisible(false);
                                    }}
                                    title={
                                        category.key
                                            ? t(`categories.${category.key}`)
                                            : category.name
                                    }
                                    leadingIcon={({ size }) => (
                                        <TextInput.Icon
                                            icon={category.icon || 'folder'}
                                            size={size}
                                            color={category.color || '#888'}
                                            style={{ marginRight: 8 }}
                                        />
                                    )}
                                />
                            ))
                        )}
                    </Menu>
                </View>

                <View style={styles.passwordContainer}>
                    <TextInput
                        label={t('passwords.password')}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={secureTextEntry}
                        style={styles.passwordInput}
                        mode="outlined"
                        theme={{ colors: { primary: tintColor } }}
                        right={
                            <TextInput.Icon
                                icon={secureTextEntry ? "eye" : "eye-off"}
                                onPress={() => setSecureTextEntry(!secureTextEntry)}
                            />
                        }
                    />
                    <IconButton
                        icon="dice-multiple"
                        size={24}
                        onPress={generateRandomPassword}
                        style={styles.generateButton}
                        iconColor={tintColor}
                    />
                </View>

                <TextInput
                    label={t('passwords.username')}
                    value={username}
                    onChangeText={setUsername}
                    style={styles.input}
                    mode="outlined"
                    autoCapitalize="none"
                    theme={{ colors: { primary: tintColor } }}
                />

                <TextInput
                    label={t('passwords.website')}
                    value={website}
                    onChangeText={setWebsite}
                    style={styles.input}
                    mode="outlined"
                    autoCapitalize="none"
                    theme={{ colors: { primary: tintColor } }}
                />

                <TextInput
                    label={t('passwords.notes')}
                    value={notes}
                    onChangeText={setNotes}
                    style={styles.input}
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                    theme={{ colors: { primary: tintColor } }}
                />

                <View style={styles.buttonContainer}>
                    <Button
                        mode="outlined"
                        onPress={() => router.back()}
                        style={styles.button}
                        disabled={isLoading}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleSave}
                        style={styles.button}
                        buttonColor={tintColor}
                        loading={isLoading}
                        disabled={isLoading || isLoadingData}
                    >
                        {isEditMode ? t('common.update') : t('common.save')}
                    </Button>
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        marginBottom: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    passwordInput: {
        flex: 1,
    },
    generateButton: {
        marginLeft: 8,
    },
    categoryContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    categoryButton: {
        width: '100%',
        marginBottom: 16,
        justifyContent: 'flex-start',
    },
    categoryInput: {
        width: '100%',
        marginBottom: 16,
    },
    menu: {
        marginTop: 60,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    button: {
        flex: 1,
        marginHorizontal: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
