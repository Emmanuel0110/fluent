import { dbService } from "./vocabularyService.js";
import { vocabularyProcessor } from "./vocabularyProcessor.js";

export async function importVocabulary(arr) {
  if (Array.isArray(arr)) {
    for (const element of arr) {
      try {
        const newWord = await importWord(element);
        if (newWord?._id && Array.isArray(newWord.translations)) {
          await setTranslationsAndTagsForTranslations(newWord);
        }
      } catch (error) {
        console.error("could not import word " + JSON.stringify(element));
        throw error;
      }
    }
  } else throw new Error("argument of importVocabulary should be an array");
}

export async function importWord(data) {
  try {
    const { language: languageLabel, level, tags, text, translations } = data;
    const language = await dbService.getLanguage(languageLabel);
    const tagIds = await getWordTags(tags, language._id);
    const translationsWithIds = await getTranslations(translations);
    const wordFound = await dbService.findLexicalItem(language._id, text);

    if (wordFound) {
      if (vocabularyProcessor.sameTagsAndTranslations(wordFound, tagIds, translationsWithIds)) {
        console.log(`Word ${text} already exists`);
        return null;
      } else {
        const { translations: mergedTranslations, tags: mergedTags } = vocabularyProcessor.prepareTranslationsAndTags(
          wordFound,
          tagIds,
          translationsWithIds
        );
        await dbService.updateLexicalItem(
          { _id: wordFound._id },
          {
            $set: { translations: mergedTranslations, tags: mergedTags },
          }
        );

        return { ...wordFound, tags: mergedTags, translations: mergedTranslations };
      }
    } else {
      const word = await dbService.createLexicalItem({
        level,
        text,
        language: language._id,
        tags: tagIds,
        translations: translationsWithIds,
      });

      return word;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getWordTags(tags, languageId) {
  const results = [];
  for (const tag of tags) {
    try {
      const result = await dbService.getWordTag(languageId, tag);
      results.push(result._id);
    } catch (error) {
      console.error("Error getting word tag", tag, error);
    }
  }
  return results;
}

async function getTranslations(translations) {
  const results = [];
  for (const translation of translations) {
    try {
      const result = await getTranslation(translation);
      results.push(result);
    } catch (error) {
      console.error("Error getting translation", translation, error);
    }
  }
  return results;
}

async function getTranslation({ language, lexicalItems }) {
  const languageObj = await dbService.getLanguage(language);
  const languageId = languageObj._id;
  const results = [];

  for (const lexicalItem of lexicalItems) {
    try {
      const result = await getWord(languageId, lexicalItem);
      results.push(result);
    } catch (error) {
      console.error("Error getting lexicalItem", lexicalItem, error);
    }
  }

  return { language: languageId, lexicalItems: results };
}

async function getWord(languageId, text) {
  let word = await dbService.findLexicalItem(languageId, text);
  if (!word) {
    word = await dbService.createLexicalItem({
      language: languageId,
      text,
      level: 0,
      translations: [],
      tags: [],
    });
  }

  return word._id;
}

export async function setTranslationsAndTagsForTranslations(newWord) {
  const translations = [
    {
      language: newWord.language,
      lexicalItems: [newWord._id],
    },
    ...newWord.translations,
  ];

  const tags = await dbService.findWordTags({ _id: { $in: newWord.tags } });
  const tagWords = await dbService.findLexicalItems({
    language: newWord.language,
    text: { $in: tags.map(({ label }) => label) },
  });

  const languages = newWord.translations.map(({ language }) => language);
  const tagsByLanguage = await getTagsByLanguage(tagWords, languages);

  for (const tr of newWord.translations) {
    for (const wordId of tr.lexicalItems) {
      for (const translation of translations) {
        if (!translation.language.equals(tr.language)) {
          const result = await dbService.updateLexicalItem(
            { _id: wordId, "translations.language": translation.language },
            {
              $addToSet: { "translations.$.lexicalItems": { $each: translation.lexicalItems } },
            }
          );

          // If language languageId does not exist, add it
          if (!result) {
            await dbService.updateLexicalItem(
              { _id: wordId },
              {
                $push: {
                  translations: translation,
                },
              }
            );
          }

          await dbService.updateLexicalItem(
            { _id: wordId },
            {
              $addToSet: { tags: { $each: tagsByLanguage[tr.language] || [] } },
            }
          );
        }
      }
    }
  }
}
async function getTagsByLanguage(tagWords, languages) {
  const initTagsByLanguage = vocabularyProcessor.prepareTagsByLanguage(tagWords, languages);
  const tagsTranslations = tagWords.map(({ translations }) => translations);
  let acc = initTagsByLanguage;

  for (const translations of tagsTranslations) {
    for (const { language, lexicalItems } of translations) {
      if (languages.some((el) => el.equals(language)) && Array.isArray(lexicalItems) && lexicalItems.length !== 0) {
        const wordTag = await getWordTagFromWordText(lexicalItems[0]);
        if (wordTag) acc[language].push(wordTag._id);
      }
    }
  }

  return acc;
}

async function getWordTagFromWordText(wordId) {
  const word = await dbService.findLexicalItems({ _id: wordId });
  if (word && word.length > 0) {
    return await dbService.getWordTag(word[0].language, word[0].text);
  }
  return null;
}
