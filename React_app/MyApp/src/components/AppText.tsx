import React, { useEffect, useState, useMemo } from 'react';
import { Text as RNText, TextInput as RNTextInput, TextProps, TextInputProps } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';

export const Text = (props: TextProps) => {
    const { language, translate } = useLanguage();
    const [translatedText, setTranslatedText] = useState<string | null>(null);

    const textToTranslate = useMemo(() => {
        if (typeof props.children === 'string') return props.children;
        if (Array.isArray(props.children)) {
            if (props.children.every(c => typeof c === 'string' || typeof c === 'number')) {
                return props.children.join('');
            }
        }
        return null;
    }, [props.children]);

    useEffect(() => {
        let mounted = true;
        if (textToTranslate && language !== 'en') {
            translate(textToTranslate).then(res => {
                if (mounted) setTranslatedText(res);
            });
        } else {
            setTranslatedText(null);
        }
        return () => { mounted = false; };
    }, [textToTranslate, language]);

    if (textToTranslate && language !== 'en' && translatedText) {
        return <RNText {...props}>{translatedText}</RNText>;
    }

    return <RNText {...props} />;
};

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>((props, ref) => {
    const { language, translate } = useLanguage();
    const [translatedPlaceholder, setTranslatedPlaceholder] = useState<string | undefined>(props.placeholder);

    useEffect(() => {
        let mounted = true;
        if (props.placeholder && language !== 'en') {
            translate(props.placeholder).then(res => {
                if (mounted) setTranslatedPlaceholder(res);
            });
        } else {
            setTranslatedPlaceholder(props.placeholder);
        }
        return () => { mounted = false; };
    }, [props.placeholder, language]);

    return <RNTextInput ref={ref} {...props} placeholder={translatedPlaceholder} />;
});
