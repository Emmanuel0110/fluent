import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { importVocabulary } from "./services/vocabularyImporter.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to your JSON file
const args = process.argv.slice(2);
if (!(args.length && typeof args[0] === "string")) {
  throw new Error("no path specified for the file to parse");
}
const pathArg = args[0];
const filePath = path.join(__dirname, pathArg);

async function main() {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(data);

    //mongoose.set("debug", true);
    mongoose.set("strictQuery", true);
    await mongoose.connect(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`
    );
    await importVocabulary(jsonData);
    console.log("File updated successfully");
  } catch (error) {
    console.error("Error reading or writing the file:", error);
  } finally {
    mongoose.disconnect().catch((disconnectError) => {
      console.error("Error during disconnection:", disconnectError);
    });
  }
}

// Run the main function only if this file is run directly
if (require.main === module) {
  main();
}

// Export for testing
export { main };
