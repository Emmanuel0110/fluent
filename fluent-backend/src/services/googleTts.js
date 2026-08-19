/**
 * Google Cloud Text-to-Speech (Chirp 3: HD voices) with an on-disk audio cache.
 *
 * Chirp 3 voices are trained per locale, so Korean is spoken by a Korean model
 * rather than by an English voice reading hangul — which is what made the vowels
 * wrong with the previous provider.
 *
 * Synthesis is only ever paid for once per (voice, text): the mp3 is written to
 * TTS_CACHE_DIR and served statically from /tts afterwards. The whole corpus is
 * ~57k characters, well inside the 1M characters/month free tier.
 *
 * Env:
 *   GOOGLE_TTS_API_KEY  an API key restricted to the Text-to-Speech API. Only
 *                       needed where audio is generated: a server serving a
 *                       pregenerated cache runs without it. The key stays
 *                       server-side, the browser only ever sees /tts URLs.
 *   TTS_CACHE_DIR       optional; where the mp3 files are kept
 *                       (default: <backend>/tts-cache)
 */

import fs from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { fileURLToPath } from "url";
import { logger } from "../logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SYNTHESIZE_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

/**
 * Where the mp3 files live. Read lazily rather than at module load: this module is
 * imported by app.js, whose imports are evaluated before its own dotenv.config()
 * call, so the env var is not set yet at that point.
 */
export function cacheDir() {
  return process.env.TTS_CACHE_DIR || path.join(__dirname, "../../tts-cache");
}

/** One Chirp 3 voice per language label, as stored in the Language collection. */
export const VOICES = {
  en: { languageCode: "en-US", name: "en-US-Chirp3-HD-Zephyr" },
  fr: { languageCode: "fr-FR", name: "fr-FR-Chirp3-HD-Zephyr" },
  ko: { languageCode: "ko-KR", name: "ko-KR-Chirp3-HD-Zephyr" },
};

export const SUPPORTED_LANGUAGES = Object.keys(VOICES);

export function isConfigured() {
  return Boolean(process.env.GOOGLE_TTS_API_KEY);
}

async function synthesize(text, voice) {
  const url = `${SYNTHESIZE_URL}?key=${encodeURIComponent(process.env.GOOGLE_TTS_API_KEY)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: voice.languageCode, name: voice.name },
      // Chirp 3 only honours audioEncoding and speakingRate; pitch and volume are rejected.
      audioConfig: { audioEncoding: "MP3" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Google TTS request failed (${response.status}): ${await response.text()}`);
  }

  const { audioContent } = await response.json();
  return Buffer.from(audioContent, "base64");
}

function cacheFileName(voiceName, text) {
  const hash = createHash("sha256").update(`${voiceName}|${text}`).digest("hex");
  return `${hash.slice(0, 32)}.mp3`;
}

// In-flight synthesis per file name, so concurrent requests for the same
// sentence (a conversation replayed from two tabs) only spend quota once.
const pending = new Map();

async function writeToCache(fileName, text, voice) {
  const directory = cacheDir();
  const filePath = path.join(directory, fileName);
  const audio = await synthesize(text, voice);
  await fs.mkdir(directory, { recursive: true });
  // Write then rename: a crash mid-write would otherwise leave a truncated mp3
  // in the cache, and it would be served as valid forever after.
  const tempPath = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(tempPath, audio);
  await fs.rename(tempPath, filePath);
  logger.info({ fileName, voice: voice.name, characters: text.length }, "Synthesized speech");
}

/**
 * File name of the already-cached mp3 for this text, or null. Never calls Google,
 * so a server holding a pregenerated cache can serve audio without any credentials.
 */
export async function getCachedFile(text, language) {
  const voice = VOICES[language];
  if (!voice) return null;

  const fileName = cacheFileName(voice.name, text);
  try {
    await fs.access(path.join(cacheDir(), fileName));
    return fileName;
  } catch {
    return null;
  }
}

/**
 * File name of the mp3 for this text, synthesizing it if it is not cached yet.
 * The caller serves it from /tts.
 */
export async function getSpeechFile(text, language) {
  const voice = VOICES[language];
  if (!voice) throw new Error(`No Chirp 3 voice configured for language "${language}"`);

  const fileName = cacheFileName(voice.name, text);

  const cached = await getCachedFile(text, language);
  if (cached) return cached;

  if (!pending.has(fileName)) {
    pending.set(
      fileName,
      writeToCache(fileName, text, voice).finally(() => pending.delete(fileName)),
    );
  }
  await pending.get(fileName);

  return fileName;
}
