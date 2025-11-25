import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslation from "./locales/en/translation.json";
import frTranslation from "./locales/fr/translation.json";
import krTranslation from "./locales/kr/translation.json";

i18n
  .use(LanguageDetector) // Detects user language
  .use(initReactI18next) // Passes i18n instance to react-i18next
  .init({
    resources: {
      en: { translation: enTranslation },
      fr: { translation: frTranslation },
      kr: { translation: krTranslation },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
