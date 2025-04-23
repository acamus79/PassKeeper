import React, { useRef, useState, useEffect } from 'react';
import { Modal, StyleSheet, View, ScrollView, Animated, Dimensions, NativeScrollEvent } from 'react-native';
import { Button } from 'react-native-paper';
import { ThemedText } from '../ui/ThemedText';
import { ThemedView } from '../ui/ThemedView';
import useThemeColor from '@hooks/useThemeColor';
import useTranslation from '@hooks/useTranslation';

interface ScrollModalProps {
    visible: boolean;
    onAccept: () => void;
    onCancel: () => void;
    title: string;
    content: string;
    acceptText?: string;
    cancelText?: string;
    requireFullScroll?: boolean;
}

const { height } = Dimensions.get('window');

export const ScrollModal: React.FC<ScrollModalProps> = ({
    visible,
    onAccept,
    onCancel,
    title,
    content,
    acceptText,
    cancelText,
    requireFullScroll = true
}) => {
    const { t } = useTranslation();
    const tintColor = useThemeColor({}, 'tint');
    const scrollY = useRef(new Animated.Value(0)).current;
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(!requireFullScroll);
    const scrollViewRef = useRef<ScrollView>(null);
    const [contentHeight, setContentHeight] = useState(0);
    const [scrollViewHeight, setScrollViewHeight] = useState(0);


    // Resetear el estado de scroll al cambiar la visibilidad o el contenido
    useEffect(() => {
        if (visible) {
            setIsScrolledToBottom(!requireFullScroll);
            scrollY.setValue(0); // Reinicia el valor del scroll
        }
    }, [visible, requireFullScroll, content]);


    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
        >
            <ThemedView style={styles.centeredView}>
                <ThemedView style={styles.modalView}>
                    <View style={styles.header}>
                        <ThemedText style={styles.modalTitle}>{title}</ThemedText>
                    </View>

                    <Animated.ScrollView
                        ref={scrollViewRef}
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={true}
                        scrollEventThrottle={16}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            {
                                useNativeDriver: false,
                                listener: (event: { nativeEvent: NativeScrollEvent }) => {
                                    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                                    const paddingToBottom = 20; // Pequeño margen para asegurar detección
                                    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

                                    // Comprobar si el contenido es más grande que el área visible
                                    const canScroll = contentSize.height > layoutMeasurement.height;

                                    if (requireFullScroll) {
                                        // Habilitar solo si se puede scrollear y se ha llegado al final
                                        if (canScroll && isCloseToBottom) {
                                            setIsScrolledToBottom(true);
                                        } else if (!canScroll) {
                                            // Si no se puede scrollear (contenido corto), habilitar directamente
                                            setIsScrolledToBottom(true);
                                        }
                                    }
                                }
                            }
                        )}
                        onLayout={(event) => {
                            setScrollViewHeight(event.nativeEvent.layout.height);
                        }}
                        onContentSizeChange={(width, height) => {
                            setContentHeight(height);
                            // Si el contenido es más pequeño que el scrollview, habilitar botón si es necesario
                            if (requireFullScroll && height <= scrollViewHeight) {
                                setIsScrolledToBottom(true);
                            }
                        }}
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
                            disabled={requireFullScroll && !isScrolledToBottom} // La lógica de disabled se mantiene
                        >
                            {acceptText || t('common.accept')}
                        </Button>
                    </View>
                </ThemedView>
            </ThemedView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)', // Fondo semitransparente para el modal
    },
    modalView: {
        width: '90%',
        height: height * 0.85, // Mantenemos el 80% de la altura
        borderRadius: 15, // Un borde ligeramente más suave
        padding: 0, // Quitamos el padding general para controlar por sección
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1, // Sombra más sutil
        },
        shadowOpacity: 0.20, // Opacidad reducida
        shadowRadius: 2.62, // Radio reducido
        elevation: 3, // Elevación reducida para Android
        overflow: 'hidden', // Importante para que el borderRadius afecte a los hijos
        // backgroundColor se hereda de ThemedView
    },
    header: {
        paddingVertical: 15, // Padding vertical
        paddingHorizontal: 20, // Padding horizontal
        paddingTop: 25, // Margen superior añadido mediante padding
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(128, 128, 128, 0.2)', // Un gris más claro y transparente
    },
    modalTitle: {
        fontSize: 20, // Ligeramente más pequeño
        fontWeight: '600', // Un poco menos bold
        textAlign: 'center',
    },
    scrollView: {
        flex: 1, // Ocupa el espacio restante
        paddingHorizontal: 20, // Padding horizontal para el contenido
        paddingTop: 15, // Espacio superior antes del texto
    },
    contentText: {
        fontSize: 15, // Ligeramente más pequeño
        lineHeight: 22, // Ajustar interlineado
        paddingBottom: 20, // Espacio al final del texto antes de los botones
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around', // Distribuir mejor los botones
        padding: 15, // Padding reducido
        borderTopWidth: 1,
        borderTopColor: 'rgba(128, 128, 128, 0.2)',
    },
    button: {
        flex: 1, // Ocupan el espacio disponible
        marginHorizontal: 8, // Espacio entre botones
    },
});
