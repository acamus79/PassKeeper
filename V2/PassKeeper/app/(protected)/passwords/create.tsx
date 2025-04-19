import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Divider, IconButton, Menu } from 'react-native-paper';
import { router } from 'expo-router';
import { ThemedView } from '@components/ui/ThemedView';
import { ThemedText } from '@components/ui/ThemedText';
import useThemeColor from '@hooks/useThemeColor';
import useTranslation from '@hooks/useTranslation';
import { SecurityUtils } from '@utils/SecurityUtils';
import { CategoryService } from '@services/CategoryService';
import { useAuth } from '@contexts/AuthContext';
import { Category } from '@app-types/entities';

export default function CreatePasswordScreen() {
    const { t } = useTranslation();
    const { userId } = useAuth();
    const tintColor = useThemeColor({}, 'tint');

    // Estados para los campos del formulario
    const [title, setTitle] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [website, setWebsite] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    // Estados para la UI
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [menuVisible, setMenuVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Cargar categorías al iniciar
    useEffect(() => {
        const loadCategories = async () => {
            if (!userId) return;
            try {
                const userCategories = await CategoryService.getUserCategories(userId);
                setCategories(userCategories);
            } catch (error) {
                console.error('Error loading categories:', error);
                Alert.alert(t('common.error'), t('categories.loadError'));
            }
        };

        loadCategories();
    }, [userId, t]);

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
        if (!title.trim()) {
            Alert.alert(t('common.error'), t('passwords.titleRequired'));
            return;
        }

        if (!password.trim()) {
            Alert.alert(t('common.error'), t('passwords.passwordRequired'));
            return;
        }

        try {
            setIsLoading(true);

            // Aquí implementarás la lógica para guardar la contraseña en la base de datos
            // Por ahora, simulamos un retraso
            await new Promise(resolve => setTimeout(resolve, 1000));

            Alert.alert(
                t('common.success'),
                t('passwords.passwordSaved'),
                [{ text: t('common.ok'), onPress: () => router.back() }]
            );
        } catch (error) {
            console.error('Error saving password:', error);
            Alert.alert(t('common.error'), t('passwords.savingError'));
        } finally {
            setIsLoading(false);
        }
    };

    const categoryAnchorRef = useRef<View>(null);

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <ThemedText style={styles.title}>{t('passwords.createNew')}</ThemedText>

                <TextInput
                    label={t('passwords.title')}
                    value={title}
                    onChangeText={setTitle}
                    style={styles.input}
                    mode="outlined"
                    theme={{ colors: { primary: tintColor } }}
                />

                <TextInput
                    label={t('passwords.username')}
                    value={username}
                    onChangeText={setUsername}
                    style={styles.input}
                    mode="outlined"
                    autoCapitalize="none"
                    theme={{ colors: { primary: tintColor } }}
                />

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

                <View style={styles.categoryContainer}>
                    <Menu
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={
                            <TextInput
                                label={t('passwords.category')}
                                value={selectedCategory ? selectedCategory.name : ''}
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
                                    title={category.name}
                                />
                            ))
                        )}
                    </Menu>
                </View>

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
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleSave}
                        style={styles.button}
                        buttonColor={tintColor}
                        loading={isLoading}
                        disabled={isLoading}
                    >
                        {t('common.save')}
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
});
