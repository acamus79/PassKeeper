import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { ThemedText } from '../ui/ThemedText';
import { ThemedView } from '../ui/ThemedView';
import useThemeColor from '../../hooks/useThemeColor';
import useTranslation from '../../hooks/useTranslation';

type MenuItem = {
    name: string;
    icon: string;
    path: string;
    label: string;
};

export default function BottomMenu() {
    const { t } = useTranslation();
    const currentPath = usePathname();
    const tintColor = useThemeColor({}, 'tint');
    const tabIconDefault = useThemeColor({}, 'tabIconDefault');

    const menuItems: MenuItem[] = [
        { name: 'home', icon: 'home', path: '/', label: t('common.home') },
        { name: 'passwords', icon: 'key', path: 'passwords', label: t('common.passwords') },
        { name: 'categories', icon: 'folder', path: 'categories', label: t('common.categories') },
        { name: 'settings', icon: 'cog', path: 'settings', label: t('common.settings') },
    ];

    const handleNavigation = (path: string) => {
        // Eliminar la barra inicial si existe
        const formattedPath = path.startsWith('/') ? path.substring(1) : path;
        router.push(formattedPath as any);
    };

    return (
        <ThemedView style={styles.container}>
            {menuItems.map((item) => {
                const isActive = currentPath === item.path;
                const color = isActive ? tintColor : tabIconDefault;

                return (
                    <TouchableOpacity
                        key={item.name}
                        style={styles.menuItem}
                        onPress={() => handleNavigation(item.path)}
                    >
                        <MaterialCommunityIcons name={item.icon as any} size={24} color={color} />
                        <ThemedText
                            style={[styles.menuItemText, { color }]}
                        >
                            {item.label}
                        </ThemedText>
                    </TouchableOpacity>
                );
            })}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: 60,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
        paddingBottom: 5,
        paddingHorizontal: 10,
        justifyContent: 'space-around',
        alignItems: 'center',
        width: Dimensions.get('window').width,
    },
    menuItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    menuItemText: {
        fontSize: 12,
        marginTop: 3,
    },
});
