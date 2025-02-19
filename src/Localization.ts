import { existsSync } from "fs";
import { Dict } from "./Essentials";
import path from "path";

const FALLBACK_LANGUAGE = 'en';

var localization: Dict<Dict<string>> = {};

function loadLanguage(language: string): void {
    if (localization[language]) {
        return;
    }
    if (!existsSync(path.join(__dirname, "localization", `${language}.json`))) {
        return;
    }
    localization[language] = require(`./localization/${language}.json`);
}

/**
 * Returns
 * @param key - The key to localize
 * @param language - ISO 639-1 standard language codes
 * @returns The text in the specified language, or the fallback language if the key is not found
 */
export function localize(key: string, language: string): string {
    loadLanguage(language);
    if (localization[language]) {
        if (localization[language][key]) {
            return localization[language][key];
        }
    }
    if (localization[FALLBACK_LANGUAGE]) {
        if (localization[FALLBACK_LANGUAGE][key]) {
            return localization[FALLBACK_LANGUAGE][key];
        }
    }
    return key;
}
