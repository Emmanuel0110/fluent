// @ts-nocheck
import mongoose from "mongoose";
import { jest } from "@jest/globals";
import { dbService } from "../services/vocabularyService.js";
import * as vocabularyImporter from "../services/vocabularyImporter.js";

describe("Vocabulary Import", () => {
  let dbServiceMock;

  beforeEach(() => {
    const languageId = new mongoose.Types.ObjectId();
    const tagId = new mongoose.Types.ObjectId();
    const wordId = new mongoose.Types.ObjectId();
    // Create mocks for all dbService methods
    dbServiceMock = {
      getLanguage: jest.spyOn(dbService, "getLanguage").mockImplementation((languageLabel) => {
        return Promise.resolve({
          _id: languageId,
          label: languageLabel,
        });
      }),
      getWordTag: jest.spyOn(dbService, "getWordTag").mockImplementation(() => {
        return Promise.resolve({
          _id: tagId,
        });
      }),
      findLexicalItem: jest.spyOn(dbService, "findLexicalItem").mockResolvedValue(null),
      createLexicalItem: jest.spyOn(dbService, "createLexicalItem").mockImplementation(() => {
        return Promise.resolve({
          _id: wordId,
          text: "mockText",
          language: languageId,
          tags: [tagId],
          translations: [],
          level: 1,
        });
      }),
      updateLexicalItem: jest.spyOn(dbService, "updateLexicalItem"),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("importWord", () => {
    it("should create a new word when it does not exist", async () => {
      const wordData = {
        language: "French",
        level: 1,
        tags: ["noun"],
        text: "maison",
        translations: [
          {
            language: "English",
            lexicalItems: ["house"],
          },
        ],
      };

      const result = await importWord(wordData);

      expect(dbServiceMock.getLanguage).toHaveBeenCalledTimes(2);
      expect(dbServiceMock.getWordTag).toHaveBeenCalledTimes(1);
      expect(dbServiceMock.findLexicalItem).toHaveBeenCalledTimes(2);
      expect(dbServiceMock.createLexicalItem).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty("_id");
    });

    it("should update an existing word when it exists but has different tags/translations", async () => {
      const existingWordId = new mongoose.Types.ObjectId();
      const existingWord = {
        _id: existingWordId,
        tags: [new mongoose.Types.ObjectId()],
        translations: [],
        language: new mongoose.Types.ObjectId(),
        text: "maison",
      };

      dbServiceMock.findLexicalItem.mockResolvedValue(existingWord);
      dbServiceMock.updateLexicalItem.mockResolvedValue({
        ...existingWord,
        tags: [...existingWord.tags, new mongoose.Types.ObjectId()],
        translations: [{ language: new mongoose.Types.ObjectId(), lexicalItems: [new mongoose.Types.ObjectId()] }],
      });

      const wordData = {
        language: "French",
        level: 1,
        tags: ["noun"],
        text: "maison",
        translations: [
          {
            language: "English",
            lexicalItems: ["house"],
          },
        ],
      };

      const result = await importWord(wordData);

      expect(dbServiceMock.findLexicalItem).toHaveBeenCalledTimes(2);
      expect(dbServiceMock.updateLexicalItem).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty("_id");
      expect(result._id).toEqual(existingWordId);
    });
  });

  describe("importVocabulary", () => {
    it("should process an array of words", async () => {
      const vocabularyData = [
        {
          language: "French",
          level: 1,
          tags: ["noun"],
          text: "maison",
          translations: [{ language: "English", lexicalItems: ["house"] }],
        },
        {
          language: "French",
          level: 1,
          tags: ["verb"],
          text: "manger",
          translations: [{ language: "English", lexicalItems: ["eat"] }],
        },
      ];

      jest.spyOn(vocabularyImporter, "importWord").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        translations: [],
      });

      jest.spyOn(vocabularyImporter, "setTranslationsAndTagsForTranslations").mockResolvedValue({});

      await importVocabulary(vocabularyData);

      expect(vocabularyImporter.importWord).toHaveBeenCalledTimes(2);
    });

    it("should throw an error if input is not an array", async () => {
      await expect(importVocabulary({ notAnArray: true })).rejects.toThrow(
        "argument of importVocabulary should be an array"
      );
    });
  });
});
