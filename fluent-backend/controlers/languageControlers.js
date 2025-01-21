import auth from "../middleware/auth.js";
import cache from "../middleware/cache.js";
import { LanguageModel } from "../models.js";
import express from "express";
const router = express.Router();

router.get("/", auth, cache, (req, res) => {
  LanguageModel.find()
    .limit(10000)
    .then((languages) => {
      res.json({ success: true, data: languages });
    });
});

export default router;
