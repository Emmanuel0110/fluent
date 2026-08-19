import { fetchSpeechUrl } from "../APICalls";

// Sentence -> audio URL, so replaying a sentence skips the round trip that only
// asks the backend where the file is. The audio itself is cached by the browser.
const audioUrls = new Map();

export default async function textToSpeech(text, language) {
  const key = `${language}|${text}`;

  if (!audioUrls.has(key)) {
    audioUrls.set(key, await fetchSpeechUrl(text, language));
  }
  const audioUrl = audioUrls.get(key);

  if (audioUrl) {
    await new Audio(audioUrl).play();
    return;
  }

  // The backend has no Google credentials (typically a dev machine): fall back to
  // Puter, whose voices are noticeably worse but need no configuration at all.
  await puterTextToSpeech(text, language);
}

async function puterTextToSpeech(text, language) {
  if (typeof window?.puter?.ai?.txt2speech !== "function") {
    console.error("Text-to-speech service is not available");
    return;
  }

  const { language: languageCode, voice, engines } = pollyVoices[language] || pollyVoices.en;

  // Polly only honours `language` for bilingual voices, so the voice itself has to
  // match the language. Engines are tried best-first: availability varies per voice.
  let lastError;
  for (const engine of engines) {
    try {
      const audio = await window.puter.ai.txt2speech(text, { voice, engine, language: languageCode });
      audio.play();
      return;
    } catch (error) {
      lastError = error;
    }
  }

  console.error("Text-to-speech failed", lastError);
}

const pollyVoices = {
  en: { language: "en-US", voice: "Joanna", engines: ["generative", "neural", "standard"] },
  fr: { language: "fr-FR", voice: "Lea", engines: ["generative", "neural", "standard"] },
  ko: { language: "ko-KR", voice: "Seoyeon", engines: ["generative", "neural", "standard"] },
};
