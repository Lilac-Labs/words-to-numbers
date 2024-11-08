import compiler from "./compiler";
import parser from "./parser";
import type { WordsToNumbersOptions } from "./types";

export type { WordsToNumbersOptions };

const wordsToNumbers = (
  text: string,
  options: WordsToNumbersOptions = {}
): string | number => {
  const regions = parser(text, options);
  if (!regions.length) {
    return text;
  }
  return compiler({ text, regions });
};

export default wordsToNumbers;
