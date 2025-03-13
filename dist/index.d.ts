interface WordsToNumbersOptions {
    fuzzy?: boolean;
    impliedHundreds?: boolean;
}

declare const wordsToNumbers: (text: string, options?: WordsToNumbersOptions) => string | number;

export { type WordsToNumbersOptions, wordsToNumbers as default, wordsToNumbers };
