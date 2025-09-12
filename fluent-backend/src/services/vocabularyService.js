import { LanguageModel, LexicalItemModel, WordTagModel } from "../models.js";

export const dbService = {
  async getLanguage(languageLabel) {
    let language = await LanguageModel.findOne({ label: languageLabel });
    if (!language) {
      language = await new LanguageModel({ label: languageLabel }).save();
    }
    return language.toObject();
  },

  async getWordTag(languageId, tagLabel) {
    let tag = await WordTagModel.findOne({ language: languageId, label: tagLabel });
    if (!tag) {
      tag = await new WordTagModel({
        language: languageId,
        label: tagLabel,
      }).save();
    }
    return tag.toObject();
  },

  async findLexicalItem(languageId, text) {
    return await LexicalItemModel.findOne({ language: languageId, text }).lean();
  },

  async createLexicalItem(data) {
    const item = await new LexicalItemModel(data).save();
    return item.toObject();
  },

  async updateLexicalItem(filter, data, options = {}) {
    return await LexicalItemModel.findOneAndUpdate(filter, data, {
      new: true,
      strict: false,
      lean: true,
      ...options,
    });
  },

  async findWordTags(criteria) {
    return await WordTagModel.find(criteria).lean();
  },

  async findLexicalItems(criteria) {
    return await LexicalItemModel.find(criteria).lean();
  },
};
