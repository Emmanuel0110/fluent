// @ts-nocheck
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { dbService } from "../services/vocabularyService.js";
import { LanguageModel, WordTagModel, LexicalItemModel } from "../models.js";

describe("dbService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getLanguage", () => {
    it("returns existing language when found", async () => {
      const fakeLanguage = { _id: "lang1", label: "French", toObject: () => ({ _id: "lang1", label: "French" }) };
      jest.spyOn(LanguageModel, "findOne").mockResolvedValue(fakeLanguage);

      const result = await dbService.getLanguage("French");

      expect(LanguageModel.findOne).toHaveBeenCalledWith({ label: "French" });
      expect(result).toEqual({ _id: "lang1", label: "French" });
    });

    it("creates and returns a new language when not found", async () => {
      jest.spyOn(LanguageModel, "findOne").mockResolvedValue(null);
      const newLang = { _id: "lang2", label: "Spanish", toObject: () => ({ _id: "lang2", label: "Spanish" }) };
      jest.spyOn(LanguageModel.prototype, "save").mockResolvedValue(newLang);

      const result = await dbService.getLanguage("Spanish");

      expect(LanguageModel.findOne).toHaveBeenCalledWith({ label: "Spanish" });
      expect(result).toEqual({ _id: "lang2", label: "Spanish" });
    });
  });

  describe("getWordTag", () => {
    it("returns existing tag when found", async () => {
      const fakeTag = { _id: "tag1", toObject: () => ({ _id: "tag1" }) };
      jest.spyOn(WordTagModel, "findOne").mockResolvedValue(fakeTag);

      const result = await dbService.getWordTag("langId", "noun");

      expect(WordTagModel.findOne).toHaveBeenCalledWith({ language: "langId", label: "noun" });
      expect(result).toEqual({ _id: "tag1" });
    });

    it("creates and returns a new tag when not found", async () => {
      jest.spyOn(WordTagModel, "findOne").mockResolvedValue(null);
      const newTag = { _id: "tag2", toObject: () => ({ _id: "tag2" }) };
      jest.spyOn(WordTagModel.prototype, "save").mockResolvedValue(newTag);

      const result = await dbService.getWordTag("langId", "verb");

      expect(WordTagModel.findOne).toHaveBeenCalledWith({ language: "langId", label: "verb" });
      expect(result).toEqual({ _id: "tag2" });
    });
  });

  describe("findLexicalItem", () => {
    it("returns null when not found", async () => {
      jest.spyOn(LexicalItemModel, "findOne").mockReturnValue({ lean: () => Promise.resolve(null) });

      const result = await dbService.findLexicalItem("langId", "maison");

      expect(LexicalItemModel.findOne).toHaveBeenCalledWith({ language: "langId", text: "maison" });
      expect(result).toBeNull();
    });

    it("returns the item when found", async () => {
      const item = { _id: "item1", text: "maison" };
      jest.spyOn(LexicalItemModel, "findOne").mockReturnValue({ lean: () => Promise.resolve(item) });

      const result = await dbService.findLexicalItem("langId", "maison");

      expect(result).toEqual(item);
    });
  });

  describe("createLexicalItem", () => {
    it("creates and returns the new lexical item", async () => {
      const data = { text: "maison", language: "langId" };
      const saved = { _id: "item1", ...data, toObject: () => ({ _id: "item1", ...data }) };
      jest.spyOn(LexicalItemModel.prototype, "save").mockResolvedValue(saved);

      const result = await dbService.createLexicalItem(data);

      expect(result).toEqual({ _id: "item1", ...data });
    });
  });

  describe("updateLexicalItem", () => {
    it("calls findOneAndUpdate with correct arguments", async () => {
      const updated = { _id: "item1", text: "maison" };
      jest.spyOn(LexicalItemModel, "findOneAndUpdate").mockResolvedValue(updated);

      const result = await dbService.updateLexicalItem({ _id: "item1" }, { $set: { text: "maison" } });

      expect(LexicalItemModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "item1" },
        { $set: { text: "maison" } },
        { new: true, strict: false, lean: true }
      );
      expect(result).toEqual(updated);
    });
  });

  describe("findWordTags", () => {
    it("returns word tags matching criteria", async () => {
      const tags = [{ _id: "t1" }, { _id: "t2" }];
      jest.spyOn(WordTagModel, "find").mockReturnValue({ lean: () => Promise.resolve(tags) });

      const result = await dbService.findWordTags({ language: "langId" });

      expect(WordTagModel.find).toHaveBeenCalledWith({ language: "langId" });
      expect(result).toEqual(tags);
    });
  });

  describe("findLexicalItems", () => {
    it("returns lexical items matching criteria", async () => {
      const items = [{ _id: "i1" }, { _id: "i2" }];
      jest.spyOn(LexicalItemModel, "find").mockReturnValue({ lean: () => Promise.resolve(items) });

      const result = await dbService.findLexicalItems({ language: "langId" });

      expect(LexicalItemModel.find).toHaveBeenCalledWith({ language: "langId" });
      expect(result).toEqual(items);
    });
  });
});
