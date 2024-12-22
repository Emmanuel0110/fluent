
import express from "express";
const router = express.Router();

router.get("/", auth, (req, res) => {
  const { sourceLanguage, targetLanguage } = req.query;
  try {
    UserFlashcardInfoModel.find({ user: req.user._id }).then((userFlashcardInfos) => {
      ConversationModel.find({
        languages: { $all: [sourceLanguage, targetLanguage] },
      }).then((conversations) => {
        Promise.all(
          conversations.map(async (conversation) => {
            const multiLingualSentences = await MultiLingualSentenceModel.find({
              _id: { $in: conversation.multiLingualSentences },
            }).lean();
            const sentences = await SentenceModel.find({
              _id: {
                $in: [
                  ...multiLingualSentences
                    .map((multiLingualSentence) => multiLingualSentence[sourceLanguage])
                    .map((id) => new mongoose.Types.ObjectId(id)),
                  ...multiLingualSentences
                    .map((multiLingualSentence) => multiLingualSentence[targetLanguage])
                    .map((id) => new mongoose.Types.ObjectId(id)),
                ],
              },
            }).lean();
            return [multiLingualSentences, sentences];
          })
        )
          .then((multiLingualSentencesAndSentences) => {
            const [completedMultiLingualSentences, completedSentences] = multiLingualSentencesAndSentences.reduce(
              ([completedMultiLingualSentences, completedSentences], [multiLingualSentences, sentences]) => {
                return [
                  [
                    ...completedMultiLingualSentences,
                    ...multiLingualSentences.map((multiLingualSentence) =>
                      completeMultiLingualSentence(multiLingualSentence, userFlashcardInfos)
                    ),
                  ],
                  [
                    ...completedSentences,
                    ...sentences.map((sentence) => completeSentence(sentence, userFlashcardInfos)),
                  ],
                ];
              },
              [[], []]
            );
            res.send({
              conversations,
              multiLingualSentences: completedMultiLingualSentences,
              sentences: completedSentences,
            });
          })
          .catch(function (err) {
            console.log(err);
          });
      });
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/", auth, (req, res) => {
  const { sourceLanguage, targetLanguage, sentenceIds } = req.body;
  try {
    UserFlashcardInfoModel.find({ user: req.user._id }).then((userFlashcardInfos) => {
      MultiLingualSentenceModel.find({
        [sourceLanguage]: { $in: sentenceIds.map((id) => new mongoose.Types.ObjectId(id)) },
      }).then((multiLingualSentences) => {
        const newConversation = new ConversationModel({
          _id: new mongoose.Types.ObjectId(),
          tags: [],
          languages: [sourceLanguage, targetLanguage],
          multiLingualSentences: multiLingualSentences.map(({ _id }) => _id),
        });
        newConversation
          .save()
          .then((newConversation) => {
            const completedMultiLingualSentences = multiLingualSentences.map((multiLingualSentence) =>
              completeMultiLingualSentence(multiLingualSentence, userFlashcardInfos)
            );
            SentenceModel.find({
              _id: {
                $in: [
                  ...multiLingualSentences
                    .map((multiLingualSentence) => multiLingualSentence[sourceLanguage])
                    .map((id) => new mongoose.Types.ObjectId(id)),
                  ...multiLingualSentences
                    .map((multiLingualSentence) => multiLingualSentence[targetLanguage])
                    .map((id) => new mongoose.Types.ObjectId(id)),
                ],
              },
            }).then((sentences) => {
              const completedSentences = sentences.map((sentence) => completeSentence(sentence, userFlashcardInfos));
              res.send({
                newConversation,
                multiLingualSentences: completedMultiLingualSentences,
                sentences: completedSentences,
              });
            });
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
    });
  } catch (err) {
    console.log(err);
  }
});

export default router;