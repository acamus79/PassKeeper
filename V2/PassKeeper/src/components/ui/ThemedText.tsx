import { Text, TextProps } from 'react-native';
import useThemeColor from '@hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
    lightColor?: string;
    darkColor?: string;
};

export function ThemedText(props: ThemedTextProps) {
    const { style, lightColor, darkColor, ...otherProps } = props;
    const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

    return <Text style={[{ color }, style]} {...otherProps} />;
}
