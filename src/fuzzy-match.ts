import { jaroWinkler } from "@skyra/jaro-winkler";
import { getAllWords } from "./constants";
import type { WordsToNumbersOptions } from "./types";

type FuzzyMatch = {
  word: string;
  score: number;
};

const fuzzyMatch = (
  word: string,
  { includeA = true }: WordsToNumbersOptions
): string => {
  const allMatches = getAllWords(includeA).map<FuzzyMatch>((numberWord) => ({
    word: numberWord,
    score: jaroWinkler(numberWord, word),
  }));

  const bestMatch = allMatches.reduce<FuzzyMatch>(
    (best, current) => (current.score > best.score ? current : best),
    { word: "", score: 0 }
  );

  return bestMatch.word;
};

export default fuzzyMatch;
