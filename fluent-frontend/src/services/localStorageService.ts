import { Word } from "../types";

export class LocalStorageService {
  private _localStorageWords: Record<string, Word> | undefined;
  private _lastUpdateDate: string | undefined;
  private languageKey: string | undefined;
  private sourceLanguage: string;
  private targetLanguage: string;

  constructor(sourceLanguage: string, targetLanguage: string) {
    this.sourceLanguage = sourceLanguage;
    this.targetLanguage = targetLanguage;
    this.languageKey = this.findLanguageKeyInLocalStorage();
    if (this.languageKey) {
      try {
        const { lastUpdateDate, words } = JSON.parse(localStorage.getItem(this.languageKey) || "{}");
        this._lastUpdateDate = lastUpdateDate;
        this._localStorageWords = words;
      } catch (e) {
        console.error("Failed to get localStorage data:", e);
      }
    }
  }

  get lastUpdateDate() {
    return this._lastUpdateDate;
  }

  get localStorageWords() {
    return this._localStorageWords;
  }

  public updateLocalStorageWords = (wordsData: Record<string, any>) => {
    try {
      if (Object.keys(wordsData).length === 0) return;
      localStorage.setItem(
        this.languageKey || this.generateLanguageKey(this.sourceLanguage, this.targetLanguage),
        JSON.stringify({
          lastUpdateDate: new Date().toISOString(),
          words: { ...this._localStorageWords, ...wordsData },
        })
      );
    } catch (e) {
      console.error("Failed to update localStorage words:", e);
    }
  };

  public clearCache() {
    const key = this.languageKey || this.generateLanguageKey(this.sourceLanguage, this.targetLanguage);
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error("Failed to clear localStorage cache:", e);
    }
  }

  private findLanguageKeyInLocalStorage() {
    return this.possibleLanguageKeys().find((key) => key in localStorage);
  }

  private possibleLanguageKeys() {
    return [
      this.generateLanguageKey(this.sourceLanguage, this.targetLanguage),
      this.generateLanguageKey(this.targetLanguage, this.sourceLanguage),
    ]; // 'en-fr' and 'fr-en' are the same set of words
  }

  private generateLanguageKey(source: string, target: string): string {
    return `${source}-${target}`;
  }
}
