export const flagCodes: Record<string, string> = {
  en: "gb",
  fr: "fr",
  ko: "kr",
};

export const nativeNames: Record<string, string> = {
  en: "English",
  fr: "Français",
  ko: "한국어",
};

export const translatedNames: Record<string, Record<string, string>> = {
  en: { en: "English", fr: "French", ko: "Korean" },
  fr: { en: "Anglais", fr: "Français", ko: "Coréen" },
  ko: { en: "영어", fr: "프랑스어", ko: "한국어" },
};
