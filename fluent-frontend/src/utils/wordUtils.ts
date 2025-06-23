import { Word, RowWord, WordTag } from "../types";

export const formatWords = (words: RowWord[]): Word[] => {
  return words.map(formatWord);
};

export const formatWord = (word: RowWord): Word => {
  return { ...word, translations: word.translations[0]?.lexicalItems || [] };
};

export const updateCacheWithNewWords = (words: { [id: string]: Word }, newWords: Word[]): { [id: string]: Word } => {
  return { ...words, ...newWords.reduce((acc, value) => ({ ...acc, [value._id]: value }), {}) };
};

export const updateCacheWithNewWordTags = (wordTags: WordTag[], newWordTags: WordTag[]): WordTag[] => {
  return newWordTags.reduce((acc: WordTag[], value: WordTag) => {
    const index: number = acc.findIndex((tag) => tag._id === value._id);
    if (index === -1) {
      return [...acc, value];
    } else {
      acc.splice(index, 1, value);
      return [...acc];
    }
  }, wordTags);
};
