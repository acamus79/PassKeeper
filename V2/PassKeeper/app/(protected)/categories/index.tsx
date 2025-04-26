import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View, TextInput, Alert } from 'react-native';
import { FAB, Card, IconButton, Avatar } from 'react-native-paper';
import { ThemedView } from '@components/ui/ThemedView';
import { ThemedText } from '@components/ui/ThemedText';
import { ScrollModal } from '@components/modals/ScrollModal';
import { useAuth } from '@contexts/AuthContext';
import { CategoryService } from '@services/CategoryService';
import { Category } from '@app-types/entities';
import { CATEGORY_ICONS } from '@constants/CategoryIcons';
import Colors, { categoryColors } from '@constants/Colors';
import useTranslation from '@hooks/useTranslation';
import useThemeColor from '@hooks/useThemeColor';

export default function CategoriesScreen() {
    const { t } = useTranslation();
    const { userId } = useAuth(); // Obtenemos el userId del contexto de autenticación
    const [categories, setCategories] = useState<Category[]>([]);
    const [editing, setEditing] = useState<Category | null>(null);
    const [form, setForm] = useState({ name: '', icon: '', color: '', user_id: userId || 0 });
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Colores temáticos
    const surfaceColor = useThemeColor({}, 'surface');
    const onSurfaceVariant = useThemeColor({}, 'onSurfaceVariant');
    const defaultBorderColor = useThemeColor({}, 'border');
    const avatarTextColor = useThemeColor({}, 'onPrimary');
    const tintColor = useThemeColor({}, 'tint');
    const errorColor = useThemeColor({}, 'error');

    const loadCategories = async () => {
        setLoading(true);
        try {
            if (userId) {
                const cats = await CategoryService.getUserCategories(userId);
                setCategories(cats);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, [userId]); // Añadimos userId como dependencia para recargar cuando cambie

    const openModal = (cat?: Category) => {
        if (cat) {
            setEditing(cat);
            setForm({
                name: cat.name,
                icon: cat.icon || '',
                color: cat.color || '',
                user_id: cat.user_id
            });
        } else {
            setEditing(null);
            setForm({ name: '', icon: '', color: '', user_id: userId || 0 });
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditing(null);
        setForm({ name: '', icon: '', color: '', user_id: userId || 0 });
    };

    const handleDelete = (cat: Category) => {
        // Aseguramos que el nombre de la categoría se muestre correctamente en el mensaje
        const categoryName = cat.name || t('passwords.unknownCategory');
        Alert.alert(
            t('categories.deleteCategory'),
            t('categories.deleteCategoryConfirm', { name: categoryName }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('categories.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        if (cat.id !== undefined) {
                            await CategoryService.deleteCategory(cat.id);
                            loadCategories();
                        }
                    }
                }
            ]
        );
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) return;
        if (editing) {
            await CategoryService.updateCategory({ ...editing, ...form });
        } else {
            await CategoryService.createCategory(form);
        }
        setEditing(null);
        setForm({ name: '', icon: '', color: '', user_id: userId || 0 });
        setModalVisible(false);
        loadCategories();
    };

    const renderItem = ({ item }: { item: Category }) => {
        const categoryDisplayName = item.key
            ? t(`categories.${item.key}`)
            : (item.name || t('passwords.unknownCategory'));
        const categoryColor = item.color;
        const categoryIcon = item.icon;
        const hasCategoryStyle = !!categoryColor;
        return (
            <Card
                style={[
                    styles.card,
                    { backgroundColor: surfaceColor },
                    hasCategoryStyle && {
                        borderLeftColor: categoryColor,
                        borderLeftWidth: 8,
                    },
                    !hasCategoryStyle && {
                        borderLeftWidth: 1,
                        borderLeftColor: defaultBorderColor,
                    }
                ]}
                elevation={2}
            >
                <Card.Title
                    title={categoryDisplayName}
                    titleStyle={{ color: onSurfaceVariant, fontWeight: 'bold' }}
                    left={(props) =>
                        categoryIcon ? (
                            <Avatar.Icon
                                {...props}
                                icon={categoryIcon}
                                size={40}
                                style={{ backgroundColor: categoryColor || defaultBorderColor }}
                                color={avatarTextColor}
                            />
                        ) : (
                            <Avatar.Icon
                                {...props}
                                icon="folder-outline"
                                size={40}
                                style={{ backgroundColor: defaultBorderColor }}
                                color={onSurfaceVariant}
                            />
                        )
                    }
                    right={(props) => (
                        <View style={styles.cardActions}>
                            <IconButton
                                {...props}
                                icon="pencil"
                                iconColor={onSurfaceVariant}
                                onPress={() => openModal(item)}
                            />
                            <IconButton
                                {...props}
                                icon="delete"
                                iconColor={errorColor}
                                onPress={() => handleDelete(item)}
                            />
                        </View>
                    )}
                />
            </Card>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <FlatList
                data={categories}
                keyExtractor={item => (item.id !== undefined ? item.id.toString() : Math.random().toString())}
                renderItem={renderItem}
                refreshing={loading}
                onRefresh={loadCategories}
                ListEmptyComponent={<ThemedText>{t('categories.noCategories')}</ThemedText>}
                contentContainerStyle={styles.listContent}
            />
            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: tintColor }]}
                onPress={() => openModal()}
                color={onSurfaceVariant}
            />
            <ScrollModal
                visible={modalVisible}
                onAccept={handleSubmit}
                onCancel={closeModal}
                title={editing ? t('categories.editCategory') : t('categories.addCategory')}
                acceptText={editing ? t('common.save') : t('categories.add')}
                cancelText={t('common.cancel')}
                requireFullScroll={false}
                content={
                    <View>
                        <TextInput
                            style={[styles.input, { backgroundColor: surfaceColor, color: onSurfaceVariant, borderColor: defaultBorderColor }]}
                            placeholder={t('categories.categoryName')}
                            placeholderTextColor={onSurfaceVariant}
                            value={form.name}
                            onChangeText={name => setForm(f => ({ ...f, name }))}
                        />
                        <View style={{ marginBottom: 12 }}>
                            <ThemedText style={{ marginBottom: 4 }}>{t('categories.categoryIcon')}</ThemedText>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                {CATEGORY_ICONS.map(icon => (
                                    <View key={icon} style={{ margin: 4 }}>
                                        <IconButton
                                            icon={icon}
                                            iconColor={form.icon === icon ? tintColor : onSurfaceVariant}
                                            size={32}
                                            style={{ backgroundColor: 'transparent', borderWidth: form.icon === icon ? 2 : 0, borderColor: form.icon === icon ? tintColor : 'transparent', borderRadius: 8 }}
                                            onPress={() => setForm(f => ({ ...f, icon }))}
                                        />
                                    </View>
                                ))}
                            </View>
                        </View>
                        <View style={{ marginBottom: 12 }}>
                            <ThemedText style={{ marginBottom: 4 }}>{t('categories.categoryColor')}</ThemedText>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                {Object.entries(categoryColors).map(([key, color]) => (
                                    <View key={key} style={{ margin: 4 }}>
                                        <IconButton
                                            icon="circle"
                                            iconColor={color}
                                            size={32}
                                            style={{
                                                backgroundColor: 'transparent',
                                                borderWidth: form.color === color ? 2 : 0,
                                                borderColor: form.color === color ? tintColor : 'transparent',
                                                borderRadius: 8
                                            }}
                                            onPress={() => setForm(f => ({ ...f, color }))}
                                        />
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                }
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    listContent: {
        paddingBottom: 80,
    },
    card: {
        marginBottom: 16,
        marginHorizontal: 5,
        borderRadius: 8,
        // Sombra para Android y iOS
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    cardActions: {
        flexDirection: 'row',
    },
    fab: {
        position: 'absolute',
        right: 10,
        bottom: 16,
        zIndex: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.light.outline,
        borderRadius: 6,
        padding: 8,
        marginBottom: 8,
    },
});
