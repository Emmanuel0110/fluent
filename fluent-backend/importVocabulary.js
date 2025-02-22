import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import mongoose from "mongoose";
import { LanguageModel, LexicalItemModel, WordTagModel } from "./models.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Define the path to your JSON file
const filePath = path.join(__dirname, "reducedVocabulary.json");

// Step 1: Read the JSON file
try {
  const data = fs.readFileSync(filePath, "utf-8");

  // Step 2: Parse the JSON string into an object
  const jsonData = JSON.parse(data);

  //mongoose.set("debug", true);
  mongoose.set("strictQuery", true);
  await mongoose.connect(
    `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`
  );

  // Step 3: Modify the object
  await importVocabulary(jsonData);

  // Step 4: Convert the object back to a JSON string
  //const updatedData = JSON.stringify(jsonData, null, 2); // Pretty print with 2 spaces

  // Step 5: Save the updated JSON string back to the file
  //fs.writeFileSync(filePath, updatedData, 'utf-8');

  console.log("File updated successfully");
} catch (error) {
  console.error("Error reading or writing the file:", error);
} finally {
  // Always close the connection
  mongoose.disconnect().catch((disconnectError) => {
    console.error("Error during disconnection:", disconnectError);
  });
}

async function importVocabulary(arr) {
  if (Array.isArray(arr)) {
    for (const element of arr) {
      try {
        const newWord = await importWord(element);
        if (newWord?._id && Array.isArray(newWord.translations)) {
          await setTranslationsAndTagsForTranslations(newWord);
        }
      } catch (error) {
        console.error("could not import word " + JSON.stringify(element));
        throw new Error(error);
      }
    }
  } else throw new Error("argument of importVocabulary should be an array");
}

async function importWord(data) {
  try {
    const { language, level, tags, text, translations } = data;
    const languageId = await getLanguage(language);
    const wordAlreadyExists = await LexicalItemModel.findOne({ language: languageId, text });
    if (wordAlreadyExists) {
      throw new Error(`Word ${text} already exists`);
    } else {
      return new LexicalItemModel({
        level,
        text,
        language: languageId,
        tags: await getWordTags(tags, languageId),
        translations: await getTranslations(translations),
      }).save();
    }
  } catch (error) {
    console.error(error);
  }
}

async function getLanguage(languageLabel) {
  let language = await LanguageModel.findOne({ label: languageLabel });
  if (!language) {
    language = await new LanguageModel({ _id: new mongoose.Types.ObjectId(), label: languageLabel }).save();
  }

  if (language?._id) {
    return language._id;
  } else {
    throw new Error("couldn't get language " + languageLabel);
  }
}

async function getWordTags(tags, languageId) {
  const results = [];
  for (const tag of tags) {
    try {
      const result = await getWordTag(languageId)(tag);
      results.push(result);
    } catch (error) {
      console.error("Error getting word tag ", tag, error);
    }
  }
  return results;
}

function getWordTag(languageId) {
  return async function (tagLabel) {
    let tag = await WordTagModel.findOne({ language: languageId, label: tagLabel });
    if (!tag) {
      console.log("Creating new tag with:", { language: languageId, label: tagLabel });
      try {
        tag = await new WordTagModel({
          language: languageId,
          label: tagLabel,
        }).save();
        console.log("Successfully saved tag:", tag);
      } catch (error) {
        console.error("Error saving tag:", error);
        throw error; // Re-throw for upstream handling
      }
    }
    if (tag?._id) {
      return tag._id;
    } else {
      throw new Error("couldn't get word tag " + tagLabel);
    }
  };
}

async function getTranslations(translations) {
  const results = [];
  for (const translation of translations) {
    try {
      const result = await getTranslation(translation);
      results.push(result);
    } catch (error) {
      console.error("Error getting translation ", translation, error);
    }
  }
  return results;
}

async function getTranslation({ language, lexicalItems }) {
  const languageId = await getLanguage(language);
  const results = [];
  for (const lexicalItem of lexicalItems) {
    try {
      const result = await getWord(languageId, lexicalItem);
      results.push(result);
    } catch (error) {
      console.error("Error getting lexicalItem ", lexicalItem, error);
    }
  }
  return { language: languageId, lexicalItems: results };
}

async function getWord(languageId, text) {
  let word = await LexicalItemModel.findOne({ language: languageId, text });
  if (!word) {
    word = await new LexicalItemModel({
      language: languageId,
      text,
      level: 0,
      translations: [],
      tags: [],
    }).save();
  }
  if (word?._id) {
    return word._id;
  } else {
    throw new Error("couldn't get word " + text);
  }
}

async function setTranslationsAndTagsForTranslations(newWord) {
  const translations = [
    {
      language: newWord.language,
      lexicalItems: [newWord._id],
    },
    ...newWord.translations,
  ];
  const tags = await WordTagModel.find({ _id: { $in: newWord.tags } });
  const tagWords = await LexicalItemModel.find({
    language: newWord.language,
    text: { $in: tags.map(({ label }) => label) },
  });
  const languages = newWord.translations.map(({ language }) => language);
  const tagsByLanguage = await getTagsByLanguage(tagWords, languages);
  for (const tr of newWord.translations) {
    for (const wordId of tr.lexicalItems) {
      for (const translation of translations) {
        if (translation.language !== tr.language) {
          const result = await LexicalItemModel.updateOne(
            { _id: wordId, "translations.language": translation.language },
            {
              $addToSet: { "translations.$.lexicalItems": { $each: translation.lexicalItems } }, // Add translationId to lexicalItems if it doesn't exist
            },
            { upsert: false } // Update only if languageId exists
          );

          // If language languageId does not exist, add it
          if (result.matchedCount === 0) {
            await LexicalItemModel.updateOne(
              { _id: wordId },
              {
                $push: {
                  translations: translation,
                },
              }
            );
          }

          await LexicalItemModel.updateOne(
            { _id: wordId },
            {
              $addToSet: { tags: { $each: tagsByLanguage[tr.language] || [] } },
            },
            { upsert: false }
          );
        }
      }
    }
  }
}

async function getTagsByLanguage(tagWords, languages) {
  const initTagsByLanguage = languages.reduce((acc, value) => ({ ...acc, [value]: [] }), {});
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
  const word = await LexicalItemModel.findById(wordId);
  if (word) {
    return getWordTag(word.language)(word.text);
  }
}
