import { dbService } from "./vocabularyService.js";
import { MultiLingualConversationModel } from "../models.js";
import { logger } from "../logger.js";

export async function importConversations(arr) {
  if (Array.isArray(arr)) {
    for (const element of arr) {
      try {
        await importConversation(element);
      } catch (error) {
        logger.error({ err: error, element }, "Could not import conversation");
        throw error;
      }
    }
  } else throw new Error("argument of importConversations should be an array");
}

export async function importConversation(data) {
  try {
    const { conversations } = data;
    const conversationsWithIds = await getConversations(conversations);

    const conversation = await new MultiLingualConversationModel({
      tags: [],
      conversations: conversationsWithIds,
    }).save();

    return conversation;
  } catch (error) {
    logger.error({ err: error }, "importConversation failed");
    throw error;
  }
}

async function getConversations(conversations) {
  const results = [];
  for (const conversation of conversations) {
    try {
      const result = await getConversation(conversation);
      results.push(result);
    } catch (error) {
      logger.error({ err: error, conversation }, "Error getting conversation");
    }
  }
  return results;
}

async function getConversation({ language, sentences }) {
  const languageObj = await dbService.getLanguage(language);
  const languageId = languageObj._id;
  const results = [];

  for (const sentence of sentences) {
    try {
      const result = await getSentence(languageId, sentence);
      results.push(result);
    } catch (error) {
      logger.error({ err: error, sentence, languageId }, "Error getting sentence");
    }
  }

  return { language: languageId, sentences: results };
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
      logger.error({ err: error, prerequisite, languageId }, "Error getting prerequisite lexical item");
    }
  }
  return results;
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
