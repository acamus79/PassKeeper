import React, { useRef } from 'react';
import { Modal, StyleSheet, View, ScrollView, Animated, Dimensions } from 'react-native';
import { Button } from 'react-native-paper';
import { ThemedText } from '../ui/ThemedText';
import { ThemedView } from '../ui/ThemedView';
import useThemeColor from '../../hooks/useThemeColor';
import useTranslation from '../../hooks/useTranslation';

interface ScrollModalProps {
    visible: boolean;
    onAccept: () => void;
    onCancel: () => void;
    title: string;
    content: string;
    acceptText?: string;
    cancelText?: string;
}

const { height } = Dimensions.get('window');

export const ScrollModal: React.FC<ScrollModalProps> = ({
    visible,
    onAccept,
    onCancel,
    title,
    content,
    acceptText,
    cancelText
}) => {
    const { t } = useTranslation();
    const tintColor = useThemeColor({}, 'tint');
    const scrollY = useRef(new Animated.Value(0)).current;

    // Efecto parallax para el título
    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -50],
        extrapolate: 'clamp',
    });

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
        >
            <ThemedView style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}>
                        <ThemedText style={styles.modalTitle}>{title}</ThemedText>
                    </Animated.View>

                    <Animated.ScrollView
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={true}
                        scrollEventThrottle={16}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: true }
                        )}
                    >
                        <ThemedText style={styles.contentText}>{content}</ThemedText>
                    </Animated.ScrollView>

                    <View style={styles.buttonContainer}>
                        <Button
                            mode="outlined"
                            onPress={onCancel}
                            style={styles.button}
                            textColor={tintColor}
                        >
                            {cancelText || t('common.cancel')}
                        </Button>
                        <Button
                            mode="contained"
                            onPress={onAccept}
                            style={styles.button}
                            buttonColor={tintColor}
                        >
                            {acceptText || t('common.accept')}
                        </Button>
                    </View>
                </View>
            </ThemedView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        width: '90%',
        height: height * 0.8,
        borderRadius: 20,
        padding: 0,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        overflow: 'hidden',
    },
    header: {
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    contentText: {
        fontSize: 16,
        lineHeight: 24,
        paddingBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    button: {
        flex: 1,
        marginHorizontal: 5,
    },
});
