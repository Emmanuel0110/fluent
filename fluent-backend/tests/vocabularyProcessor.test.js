import mongoose from "mongoose";
import { vocabularyProcessor } from "../services/vocabularyProcessor.js";

describe("vocabularyProcessor", () => {
  describe("sameTagsAndTranslations", () => {
    it("should return false when tags are different", () => {
      const wordFound = {
        tags: [new mongoose.Types.ObjectId()],
        translations: [],
      };
      const tagIds = [new mongoose.Types.ObjectId()];
      const translationsWithIds = [];

      const result = vocabularyProcessor.sameTagsAndTranslations(wordFound, tagIds, translationsWithIds);

      expect(result).toBe(false);
    });

    it("should return false when translations length is different", () => {
      const tagId = new mongoose.Types.ObjectId();
      const wordFound = {
        tags: [tagId],
        translations: [{ language: new mongoose.Types.ObjectId(), lexicalItems: [] }],
      };
      const tagIds = [tagId];
      const translationsWithIds = [];

      const result = vocabularyProcessor.sameTagsAndTranslations(wordFound, tagIds, translationsWithIds);

      expect(result).toBe(false);
    });

    it("should return true when tags and translations are the same", () => {
      const tagId = new mongoose.Types.ObjectId();
      const languageId = new mongoose.Types.ObjectId();
      const lexicalItemId = new mongoose.Types.ObjectId();

      const wordFound = {
        tags: [tagId],
        translations: [
          {
            language: languageId,
            lexicalItems: [lexicalItemId],
          },
        ],
      };

      const tagIds = [tagId];
      const translationsWithIds = [
        {
          language: { equals: (id) => id.equals(languageId) },
          lexicalItems: [lexicalItemId],
        },
      ];

      const result = vocabularyProcessor.sameTagsAndTranslations(wordFound, tagIds, translationsWithIds);

      expect(result).toBe(true);
    });
  });

  describe("prepareTranslationsAndTags", () => {
    it("should merge tags correctly", () => {
      const tag1 = new mongoose.Types.ObjectId();
      const tag2 = new mongoose.Types.ObjectId();

      const wordFound = {
        tags: [tag1],
        translations: [],
      };

      const tagIds = [tag2];
      const translationsWithIds = [];

      const result = vocabularyProcessor.prepareTranslationsAndTags(wordFound, tagIds, translationsWithIds);

      expect(result.tags).toHaveLength(2);
      expect(result.tags).toContainEqual(tag1);
      expect(result.tags).toContainEqual(tag2);
    });

    it("should merge translations correctly", () => {
      const languageId1 = new mongoose.Types.ObjectId();
      const languageId2 = new mongoose.Types.ObjectId();
      const lexicalItemId1 = new mongoose.Types.ObjectId();
      const lexicalItemId2 = new mongoose.Types.ObjectId();

      const wordFound = {
        tags: [],
        translations: [
          {
            language: languageId1,
            lexicalItems: [lexicalItemId1],
          },
        ],
      };

      const tagIds = [];
      const translationsWithIds = [
        {
          language: languageId1,
          lexicalItems: [lexicalItemId2],
        },
        {
          language: languageId2,
          lexicalItems: [lexicalItemId1],
        },
      ];

      const result = vocabularyProcessor.prepareTranslationsAndTags(wordFound, tagIds, translationsWithIds);

      expect(result.translations).toHaveLength(2);
      expect(result.translations[0].lexicalItems).toHaveLength(2);
      expect(result.translations[0].lexicalItems).toContainEqual(lexicalItemId1);
      expect(result.translations[0].lexicalItems).toContainEqual(lexicalItemId2);
      expect(result.translations[1].language).toEqual(languageId2);
    });
  });
});
