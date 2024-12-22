
import express from "express";
const router = express.Router();

router.get("/", auth, (req, res) => {
  LexicalItemModel.find({ sourceLanguage: req.query.sourceLanguage })
    .limit(10000)
    .select({ _id: 1, sourceLanguage: 1, text: 1, [req.query.targetLanguage]: 1, tags: 1 })
    .lean()
    .then((sourceWords) => {
      LexicalItemModel.find({ sourceLanguage: req.query.targetLanguage })
        .limit(10000)
        .select({ _id: 1, sourceLanguage: 1, text: 1, [req.query.sourceLanguage]: 1, tags: 1 })
        .then((targetWords) => {
          res.send({ [req.query.sourceLanguage]: sourceWords, [req.query.targetLanguage]: targetWords });
        });
    });
});

router.post("/", auth, (req, res) => {
  const newWord = new LexicalItemModel({
    _id: new mongoose.Types.ObjectId(),
    ...req.body,
  });
  newWord
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

router.patch("/api/words/:id", auth, function (req, res) {
  const { id: _id } = req.params;
  const filter = { _id };
  LexicalItemModel.updateOne(filter, req.body).then((data) => res.json({ success: true, data }));
});

export default router;