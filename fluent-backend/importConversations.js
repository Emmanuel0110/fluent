import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import mongoose from "mongoose";
import { LexicalItemModel, LanguageModel, MultiLingualConversationModel } from "./models.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Define the path to your JSON file
const filePath = path.join(__dirname, "conversations.json");

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
  await importConversations(jsonData);

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

async function importConversations(arr) {
  if (Array.isArray(arr)) {
    for (const element of arr) {
      try {
        await importConversation(element);
      } catch (error) {
        console.error("could not import conversation " + JSON.stringify(element));
        throw new Error(error);
      }
    }
  } else throw new Error("argument of importConversations should be an array");
}

async function importConversation({conversations}) {
  try {
    return new MultiLingualConversationModel({
      _id: new mongoose.Types.ObjectId(),
      tags: [],
      conversations: await getConversations(conversations),
    }).save();
  } catch (error) {
    console.error(error);
  }
}

async function getConversations(conversations) {
  const results = [];
  for (const conversation of conversations) {
    try {
      const result = await getConversation(conversation);
      results.push(result);
    } catch (error) {
      console.error("Error getting conversation ", conversation, error);
    }
  }
  return results;
}

async function getConversation({ language, sentences }) {
  const languageId = await getLanguage(language);
  const results = [];
  for (const sentence of sentences) {
    try {
      const result = await getSentence(languageId, sentence);
      results.push(result);
    } catch (error) {
      console.error("Error getting lexicalItem ", sentence, error);
    }
  }
  return { language: languageId, sentences: results };
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

async function getSentence(languageId, { text, prerequisites }) {
  return {
    text,
    prerequisites: await getPrerequisites(languageId, prerequisites),
  };
}

async function getPrerequisites(languageId, prerequisites) {
  const results = [];
  for (const prerequisite of prerequisites) {
    try {
      const result = await getWord(languageId, prerequisite);
      results.push(result);
    } catch (error) {
      console.error("Error getting lexicalItem ", prerequisite, error);
    }
  }
  return results;
}

async function getWord(languageId, text) {
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
}
