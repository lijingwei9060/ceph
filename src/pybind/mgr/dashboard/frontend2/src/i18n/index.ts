import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all locale files
import enUS from './locales/en-US.json';
import de from './locales/de.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import pl from './locales/pl.json';
import ptBR from './locales/pt-BR.json';
import ru from './locales/ru.json';
import tr from './locales/tr.json';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';

// Language name mapping for display
export const LANGUAGES: Record<string, string> = {
  'en-US': 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  pl: 'Polski',
  'pt-BR': 'Português (Brasil)',
  ru: 'Русский',
  tr: 'Türkçe',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'en-US': { translation: enUS },
      de: { translation: de },
      es: { translation: es },
      fr: { translation: fr },
      it: { translation: it },
      ja: { translation: ja },
      ko: { translation: ko },
      pl: { translation: pl },
      'pt-BR': { translation: ptBR },
      ru: { translation: ru },
      tr: { translation: tr },
      'zh-CN': { translation: zhCN },
      'zh-TW': { translation: zhTW },
    },
    fallbackLng: 'en-US',
    supportedLngs: Object.keys(LANGUAGES),
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['cookie', 'navigator'],
      lookupCookie: 'cd-lang',
      caches: ['cookie'],
    },
    // Log missing keys in development
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (lngs, _ns, key) => {
      if (import.meta.env.DEV) {
        console.warn(`Missing translation key: ${key} for languages: ${lngs.join(', ')}`);
      }
    },
  });

export default i18n;
