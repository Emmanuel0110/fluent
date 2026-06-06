import { LanguageModel } from "../models.js";
import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  LanguageModel.find()
    .limit(1000)
    .then((languages) => {
      res.json({ success: true, data: languages });
    });
});

export default router;
