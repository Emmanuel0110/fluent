
import auth from '../middleware/auth.js';
import express from "express";
const router = express.Router();

router.get("/", auth, (req, res) => {
  const language = req.query.sourceLanguage;
  TagModel.find({ [language]: { $exists: true } })
    .limit(10000)
    .select({ _id: 1, type: 1, [language]: 1 })
    .lean()
    .then((tags) => {
      // Group tags by their type
      const groupedTags = {
        wordTags: [],
        conversationTags: [],
      };
      tags.forEach((tag) => {
        if (tag.type === "wordTag") {
          groupedTags.wordTags.push({ _id: tag._id, label: tag[language] });
        } else if (tag.type === "conversationTag") {
          groupedTags.conversationTags.push({ _id, label: tag[language] });
        }
      });
      res.json(groupedTags);
    });
});

router.post("/", auth, (req, res) => {
  const newTag = new TagModel({
    _id: new mongoose.Types.ObjectId(),
    ...req.body,
  });
  newTag
    .save()
    .then((newElement) => {
      res.send({ data: newElement });
    })
    .catch(function (err) {
      console.log("save error ", err);
      if (err.name === "MongoError" && err.code === 11000) {
        res.json({ success: false, message: "already exists" });
        return;
      }
      res.json({ success: false, message: "some error happened" });
      return;
    });
});

export default router;