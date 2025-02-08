import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import mongoose from "mongoose";
import { LanguageModel, LexicalItemModel, WordTagModel } from "./models.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Define the path to your JSON file
const filePath = path.join(__dirname, "vocabulary.json");
const targetPath = path.join(__dirname, "wordList.json");
// Step 1: Read the JSON file
try {
  const data = fs.readFileSync(filePath, "utf-8");

  // Step 2: Parse the JSON string into an object
  const jsonData = JSON.parse(data);

  // Step 3: Modify the object
  const list = listWords(jsonData);

  // Step 4: Convert the object back to a JSON string
  const updatedData = JSON.stringify(list, null, 2); // Pretty print with 2 spaces

  // Step 5: Save the updated JSON string back to the file
  fs.writeFileSync(targetPath, updatedData, 'utf-8');

  console.log("File updated successfully");
} catch (error) {
  console.error("Error reading or writing the file:", error);
}

function listWords(jsonData) {
  return jsonData.map(({text}) => text);
}