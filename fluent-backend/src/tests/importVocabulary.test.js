// @ts-nocheck
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { createVocabularyImporter } from "../services/vocabularyImporter.js";

describe("Vocabulary Import", () => {
  const languageId = new mongoose.Types.ObjectId();
  const tagId = new mongoose.Types.ObjectId();
  const wordId = new mongoose.Types.ObjectId();

  let fakeDbService;
  let fakeVocabularyProcessor;
  let importer;

  beforeEach(() => {
    fakeDbService = {
      getLanguage: jest.fn((languageLabel) => Promise.resolve({ _id: languageId, label: languageLabel })),
      getWordTag: jest.fn().mockResolvedValue({ _id: tagId }),
      findLexicalItem: jest.fn().mockResolvedValue(null),
      createLexicalItem: jest.fn().mockResolvedValue({
        _id: wordId,
        text: "mockText",
        language: languageId,
        tags: [tagId],
        translations: [],
        level: 1,
      }),
      updateLexicalItem: jest.fn().mockResolvedValue(null),
      findWordTags: jest.fn().mockResolvedValue([]),
      findLexicalItems: jest.fn().mockResolvedValue([]),
    };

    fakeVocabularyProcessor = {
      sameTagsAndTranslations: jest.fn().mockReturnValue(false),
      prepareTranslationsAndTags: jest.fn().mockReturnValue({ translations: [], tags: [] }),
      prepareTagsByLanguage: jest.fn().mockReturnValue({}),
    };

    importer = createVocabularyImporter({ dbService: fakeDbService, vocabularyProcessor: fakeVocabularyProcessor });
  });

  describe("importWord", () => {
    it("should create a new word when it does not exist", async () => {
      const wordData = {
        language: "French",
        level: 1,
        tags: ["noun"],
        text: "maison",
        translations: [{ language: "English", lexicalItems: ["house"] }],
      };

      const result = await importer.importWord(wordData);

      expect(fakeDbService.getLanguage).toHaveBeenCalledTimes(2);
      expect(fakeDbService.getWordTag).toHaveBeenCalledTimes(1);
      expect(fakeDbService.findLexicalItem).toHaveBeenCalledTimes(2);
      expect(fakeDbService.createLexicalItem).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty("_id");
    });

    it("should update an existing word when it exists but has different tags/translations", async () => {
      const existingWordId = new mongoose.Types.ObjectId();
      const existingWord = {
        _id: existingWordId,
        tags: [new mongoose.Types.ObjectId()],
        translations: [],
        language: languageId,
        text: "maison",
      };

      fakeDbService.findLexicalItem.mockResolvedValue(existingWord);
      fakeDbService.updateLexicalItem.mockResolvedValue({
        ...existingWord,
        tags: [...existingWord.tags, new mongoose.Types.ObjectId()],
        translations: [{ language: languageId, lexicalItems: [wordId] }],
      });

      const wordData = {
        language: "French",
        level: 1,
        tags: ["noun"],
        text: "maison",
        translations: [{ language: "English", lexicalItems: ["house"] }],
      };

      const result = await importer.importWord(wordData);

      expect(fakeDbService.findLexicalItem).toHaveBeenCalledTimes(2);
      expect(fakeDbService.updateLexicalItem).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty("_id");
      expect(result._id).toEqual(existingWordId);
    });
  });

  describe("importVocabulary", () => {
    it("should process an array of words by calling importWord for each", async () => {
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

      jest.spyOn(importer, "importWord").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        translations: [],
      });
      jest.spyOn(importer, "setTranslationsAndTagsForTranslations").mockResolvedValue(undefined);

      await importer.importVocabulary(vocabularyData);

      expect(importer.importWord).toHaveBeenCalledTimes(2);
    });

    it("should throw an error if input is not an array", async () => {
      await expect(importer.importVocabulary({ notAnArray: true })).rejects.toThrow(
        "argument of importVocabulary should be an array"
      );
    });
  });
});
