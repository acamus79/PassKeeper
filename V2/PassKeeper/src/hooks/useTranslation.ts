import { useTranslation as useI18nTranslation } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useState } from 'react';

// Importamos las traducciones
import en from '../i18n/locales/en.json';
import es from '../i18n/locales/es.json';

const resources = {
    en: {
        translation: en
    },
    es: {
        translation: es
    }
};

// Configuramos i18next
i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'es', // Establecemos español como idioma predeterminado
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default function useTranslation() {
    const { t, i18n: i18nInstance } = useI18nTranslation();
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

    const changeLanguage = (lng: string) => {
        i18nInstance.changeLanguage(lng);
        setCurrentLanguage(lng);
    };

    return {
        t,
        currentLanguage,
        changeLanguage,
    };
}
