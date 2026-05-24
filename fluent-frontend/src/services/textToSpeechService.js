export default async function textToSpeech(text, language) {
  // exemple of language format: "en-US"
  if (typeof window?.puter?.ai?.txt2speech === "function") {
    return window.puter.ai
      .txt2speech(text, {
        voice: "Joanna",
        engine: "generative",
        language: puterLanguageLabels[language] || "en-US",
      })
      .then((audio) => {
        audio.play();
      });
  } else {
    console.error("Text-to-speech service is not available");
  }
}

const puterLanguageLabels = {
  en: "en-US",
  fr: "fr-FR",
  ko: "ko-KR",
};
