import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_TRANSLATE_API_KEY;
const CACHE_KEY = "@translated_strings_v1";

type TranslationCache = {
    [lang: string]: {
        [text: string]: string;
    };
};

interface LanguageContextType {
    language: string;
    setLanguage: (lang: string) => void;
    translate: (text: string) => Promise<string>;
}

export const LanguageContext = createContext<LanguageContextType>({
    language: 'en',
    setLanguage: () => { },
    translate: async (txt) => txt,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState('en');
    const [cache, setCache] = useState<TranslationCache>({});

    useEffect(() => {
        (async () => {
            try {
                const savedLang = await AsyncStorage.getItem('@app_language');
                if (savedLang) setLanguageState(savedLang);

                const savedCache = await AsyncStorage.getItem(CACHE_KEY);
                if (savedCache) setCache(JSON.parse(savedCache));
            } catch (e) { }
        })();
    }, []);

    const setLanguage = async (lang: string) => {
        setLanguageState(lang);
        try {
            await AsyncStorage.setItem('@app_language', lang);
        } catch (e) {
            // Silently handle if native module is not linked in Expo Go
        }
    };

    const decodeHTMLEntities = (text: string) => {
        return text
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
    };

    const translate = async (text: string): Promise<string> => {
        if (!text || typeof text !== 'string') return text;
        if (language === 'en') return text;

        if (cache[language]?.[text]) {
            return cache[language][text];
        }

        try {
            const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q: text,
                    target: language,
                    source: 'en'
                })
            });
            const data = await res.json();

            if (data.error) {
                console.warn("Google Translate API Error:", data.error.message);
                return text;
            }

            const translated = data.data.translations[0].translatedText;
            const decodedTranslated = decodeHTMLEntities(translated);

            setCache(prev => {
                const newCache = {
                    ...prev,
                    [language]: { ...(prev[language] || {}), [text]: decodedTranslated }
                };
                AsyncStorage.setItem(CACHE_KEY, JSON.stringify(newCache)).catch(() => { });
                return newCache;
            });
            return decodedTranslated;
        } catch (e) {
            console.warn("Translation request failed:", e);
            return text;
        }
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, translate }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
