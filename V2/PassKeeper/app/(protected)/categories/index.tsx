import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '../../../src/components/ui/ThemedView';
import { ThemedText } from '../../../src/components/ui/ThemedText';

export default function CategoriesScreen() {
    return (
        <ThemedView style={styles.container}>
            <ThemedText>Categorías (En desarrollo)</ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
});
