import auth from "../middleware/auth.js";
import { WordTagModel } from "../models.js";
import express from "express";
const router = express.Router();

router.get("/", auth, (req, res) => {
  const language = req.query.sourceLanguage;
  WordTagModel.find({ language })
    .limit(10000)
    .then((tags) => {
      res.json({ success: true, data: tags });
    });
});

router.post("/", auth, (req, res) => {
  const newTag = new WordTagModel({
    _id: new mongoose.Types.ObjectId(),
    ...req.body,
  });
  newTag
    .save()
    .then((newElement) => {
      res.send({ success: true, data: newElement });
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
