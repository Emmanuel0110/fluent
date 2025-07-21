import { arraysEqual, mergeArraysWithoutDuplicates } from "../utils.js";

export const vocabularyProcessor = {
  sameTagsAndTranslations(wordFound, tagIds, translationsWithIds) {
    // Tags
    if (!arraysEqual(wordFound.tags, tagIds)) return false;

    // Translations
    return (
      wordFound.translations.length === translationsWithIds.length &&
      wordFound.translations.every(({ language, lexicalItems }) => {
        return translationsWithIds.some(
          (el) => el.language.equals(language) && arraysEqual(el.lexicalItems, lexicalItems)
        );
      })
    );
  },

  prepareTranslationsAndTags(wordFound, tagIds, translationsWithIds) {
    const tags = mergeArraysWithoutDuplicates(wordFound.tags, tagIds);
    const translations = [
      ...wordFound.translations.map(({ language, lexicalItems: currentLexicalItems }) => {
        const lexicalItems =
          translationsWithIds.find((translation) => translation.language.equals(language))?.lexicalItems || [];
        const newLexicalItems = mergeArraysWithoutDuplicates(currentLexicalItems, lexicalItems);
        return { language, lexicalItems: newLexicalItems };
      }),
      ...translationsWithIds.filter(
        ({ language }) => !wordFound.translations.find((translation) => translation.language.equals(language))
      ),
    ];
    return { translations, tags };
  },

  prepareTagsByLanguage(tagWords, languages) {
    const initTagsByLanguage = languages.reduce((acc, value) => ({ ...acc, [value]: [] }), {});
    return initTagsByLanguage;
  },
};
