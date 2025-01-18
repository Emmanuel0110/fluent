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
const filePath = path.join(__dirname, "vocabulary.json");

// Step 1: Read the JSON file
try {
  const data = fs.readFileSync(filePath, "utf-8");

  // Step 2: Parse the JSON string into an object
  const jsonData = JSON.parse(data);

  mongoose.set("debug", true);
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
          for (const { lexicalItems } of newWord.translations) {
            for (const wordId of lexicalItems) {
              await setTranslation(wordId, newWord.language, newWord._id);
            }
          }
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
        _id: new mongoose.Types.ObjectId(),
        level,
        text,
        language: languageId,
        tags: await getTags(tags, languageId),
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

async function getTags(tags, languageId) {
  const results = [];
  for (const tag of tags) {
    try {
      const result = await getTag(languageId)(tag);
      results.push(result);
    } catch (error) {
      console.error("Error getting tag ", tag, error);
    }
  }
  return results;
}

function getTag(languageId) {
  return async function (tagLabel) {
    let tag = await WordTagModel.findOne({ language: languageId, label: tagLabel });
    if (!tag) {
      console.log("Creating new tag with:", { language: languageId, label: tagLabel });
      try {
        tag = await new WordTagModel({
          _id: new mongoose.Types.ObjectId(),
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
      throw new Error("couldn't get tag " + tagLabel);
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
      const result = await getWord(languageId)(lexicalItem);
      results.push(result);
    } catch (error) {
      console.error("Error getting lexicalItem ", lexicalItem, error);
    }
  }
  return { language: languageId, lexicalItems: results };
}

function getWord(languageId) {
  return async function (text) {
    let word = await LexicalItemModel.findOne({ language: languageId, text });
    if (!word) {
      word = await new LexicalItemModel({
        _id: new mongoose.Types.ObjectId(),
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
  };
}

async function setTranslation(wordId, languageId, translationId) {
  const result = await LexicalItemModel.updateOne(
    { _id: wordId, "translations.language": languageId },
    {
      $addToSet: { "translations.$.lexicalItems": translationId }, // Add translationId to lexicalItems if it doesn't exist
    },
    { upsert: false } // Update only if languageId exists
  );

  // If language languageId does not exist, add it along with "d"
  if (result.matchedCount === 0) {
    await LexicalItemModel.updateOne(
      { _id: wordId },
      {
        $push: {
          translations: {
            language: languageId,
            lexicalItems: [translationId],
          },
        },
      }
    );
  }
}
