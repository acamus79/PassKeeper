import Colors from '../constants/Colors';
import useColorScheme from './useColorScheme';

type ColorName = keyof typeof Colors.light;

export default function useThemeColor(
    props: { light?: string; dark?: string },
    colorName: ColorName
) {
    const theme = useColorScheme() ?? 'light'; // Asegura que siempre haya un tema ('light' por defecto)
    const colorFromProps = props[theme];

    if (colorFromProps) {
        return colorFromProps;
    } else {
        return Colors[theme][colorName];
    }
}
