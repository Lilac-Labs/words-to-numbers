import {
  BLACKLIST_SINGULAR_WORDS,
  DECIMALS,
  getNumberMap,
  getNumberWords,
  getUnitKeys,
  JOINERS,
  MAGNITUDE_KEYS,
  PUNCTUATION,
  TEN_KEYS,
} from "./constants";
import fuzzyMatch from "./fuzzy-match";
import { TokenType } from "./types";
import type { Region, SubRegion, Token, WordsToNumbersOptions } from "./types";

enum Action {
  SKIP,
  ADD,
  START_NEW_REGION,
  NOPE,
}

const canAddTokenToEndOfSubRegion = (
  subRegion: SubRegion,
  currentToken: Token,
  { impliedHundreds }: WordsToNumbersOptions
) => {
  const { tokens } = subRegion;
  const prevToken = tokens[0];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!prevToken) {
    return true;
  }

  if (
    prevToken.type === TokenType.MAGNITUDE &&
    currentToken.type === TokenType.UNIT
  ) {
    return true;
  }

  if (
    prevToken.type === TokenType.MAGNITUDE &&
    currentToken.type === TokenType.TEN
  ) {
    return true;
  }

  if (
    impliedHundreds &&
    subRegion.type === TokenType.MAGNITUDE &&
    prevToken.type === TokenType.TEN &&
    currentToken.type === TokenType.UNIT
  ) {
    return true;
  }

  if (
    impliedHundreds &&
    subRegion.type === TokenType.MAGNITUDE &&
    prevToken.type === TokenType.UNIT &&
    currentToken.type === TokenType.TEN
  ) {
    return true;
  }

  if (
    prevToken.type === TokenType.TEN &&
    currentToken.type === TokenType.UNIT
  ) {
    return true;
  }

  if (
    !impliedHundreds &&
    prevToken.type === TokenType.TEN &&
    currentToken.type === TokenType.UNIT
  ) {
    return true;
  }

  if (
    prevToken.type === TokenType.MAGNITUDE &&
    currentToken.type === TokenType.MAGNITUDE
  ) {
    return true;
  }

  if (
    !impliedHundreds &&
    prevToken.type === TokenType.TEN &&
    currentToken.type === TokenType.TEN
  ) {
    return false;
  }

  if (
    impliedHundreds &&
    prevToken.type === TokenType.TEN &&
    currentToken.type === TokenType.TEN
  ) {
    return true;
  }

  return false;
};

const getSubRegionType = (
  subRegion: SubRegion | null,
  currentToken: Token,
  { includeA = true }: WordsToNumbersOptions
) => {
  if (!subRegion) {
    return { type: currentToken.type, isHundred: false };
  }

  const NUMBER = getNumberMap(includeA);

  const prevToken = subRegion.tokens[0];
  const isHundred =
    (prevToken.type === TokenType.TEN &&
      currentToken.type === TokenType.UNIT) ||
    (prevToken.type === TokenType.TEN && currentToken.type === TokenType.TEN) ||
    (prevToken.type === TokenType.UNIT &&
      currentToken.type === TokenType.TEN &&
      NUMBER[prevToken.lowerCaseValue] > 9) ||
    (prevToken.type === TokenType.UNIT &&
      currentToken.type === TokenType.UNIT) ||
    (prevToken.type === TokenType.TEN &&
      currentToken.type === TokenType.UNIT &&
      subRegion.type === TokenType.MAGNITUDE);

  if (subRegion.type === TokenType.MAGNITUDE) {
    return { type: TokenType.MAGNITUDE, isHundred };
  }

  if (isHundred) {
    return { type: TokenType.HUNDRED, isHundred };
  }

  return { type: currentToken.type, isHundred };
};

const checkIfTokenFitsSubRegion = (
  subRegion: SubRegion | null,
  token: Token,
  options: WordsToNumbersOptions
) => {
  const { type, isHundred } = getSubRegionType(subRegion, token, options);

  if (!subRegion) {
    return { action: Action.START_NEW_REGION, type, isHundred };
  }

  if (canAddTokenToEndOfSubRegion(subRegion, token, options)) {
    return { action: Action.ADD, type, isHundred };
  }

  return { action: Action.START_NEW_REGION, type, isHundred };
};

const getSubRegions = (region: Region, options: WordsToNumbersOptions) => {
  const subRegions: SubRegion[] = [];
  let currentSubRegion: SubRegion | null = null;
  const tokensCount = region.tokens.length;

  let i = tokensCount - 1;
  while (i >= 0) {
    const token = region.tokens[i];
    const { action, type, isHundred } = checkIfTokenFitsSubRegion(
      currentSubRegion,
      token,
      options
    );

    token.type = isHundred ? TokenType.HUNDRED : token.type;
    switch (action) {
      case Action.ADD: {
        if (currentSubRegion) {
          currentSubRegion.type = type;
          currentSubRegion.tokens.unshift(token);
        }
        break;
      }

      case Action.START_NEW_REGION: {
        currentSubRegion = {
          tokens: [token],
          type,
        };
        subRegions.unshift(currentSubRegion);
        break;
      }

      default:
        break;
    }
    i -= 1;
  }
  return subRegions;
};

const canAddTokenToEndOfRegion = (
  region: Region,
  currentToken: Token,
  { impliedHundreds }: WordsToNumbersOptions
) => {
  const { tokens } = region;
  const prevToken = tokens[tokens.length - 1];
  if (
    !impliedHundreds &&
    prevToken.type === TokenType.UNIT &&
    currentToken.type === TokenType.UNIT &&
    !region.hasDecimal
  ) {
    return false;
  }

  if (
    !impliedHundreds &&
    prevToken.type === TokenType.UNIT &&
    currentToken.type === TokenType.TEN
  ) {
    return false;
  }

  if (
    !impliedHundreds &&
    prevToken.type === TokenType.TEN &&
    currentToken.type === TokenType.TEN
  ) {
    return false;
  }

  return true;
};

const checkIfTokenFitsRegion = (
  region: Region | null,
  token: Token,
  options: WordsToNumbersOptions
) => {
  const isDecimal = DECIMALS.includes(token.lowerCaseValue);
  if ((!region || !region.tokens.length) && isDecimal) {
    return Action.START_NEW_REGION;
  }

  const isPunctuation = PUNCTUATION.includes(token.lowerCaseValue);
  if (isPunctuation) {
    return Action.SKIP;
  }

  const isJoiner = JOINERS.includes(token.lowerCaseValue);
  if (isJoiner) {
    return Action.SKIP;
  }

  if (isDecimal && !region?.hasDecimal) {
    return Action.ADD;
  }

  const NUMBER_WORDS = getNumberWords(options.includeA ?? true);
  const isNumberWord = NUMBER_WORDS.includes(token.lowerCaseValue);
  if (isNumberWord) {
    if (!region) {
      return Action.START_NEW_REGION;
    }

    if (canAddTokenToEndOfRegion(region, token, options)) {
      return Action.ADD;
    }

    return Action.START_NEW_REGION;
  }

  return Action.NOPE;
};

const checkBlacklist = (tokens: Token[]): boolean =>
  tokens.length === 1 &&
  BLACKLIST_SINGULAR_WORDS.includes(tokens[0].lowerCaseValue);

const matchRegions = (
  tokens: Token[],
  options: WordsToNumbersOptions
): Region[] => {
  const regions: Region[] = [];

  if (checkBlacklist(tokens)) {
    return regions;
  }

  let i = 0;
  let currentRegion: Region | null = null;
  const tokensCount = tokens.length;
  while (i < tokensCount) {
    const token = tokens[i];
    const tokenFits = checkIfTokenFitsRegion(currentRegion, token, options);
    switch (tokenFits) {
      case Action.SKIP: {
        break;
      }

      case Action.ADD: {
        if (currentRegion) {
          currentRegion.end = token.end;
          currentRegion.tokens.push(token);
          if (token.type === TokenType.DECIMAL) {
            currentRegion.hasDecimal = true;
          }
        }
        break;
      }

      case Action.START_NEW_REGION: {
        currentRegion = {
          start: token.start,
          end: token.end,
          tokens: [token],
          type: undefined,
          hasDecimal: false,
          subRegions: [],
        };
        regions.push(currentRegion);
        if (token.type === TokenType.DECIMAL) {
          currentRegion.hasDecimal = true;
        }
        break;
      }

      case Action.NOPE:
      default: {
        currentRegion = null;
        break;
      }
    }
    i += 1;
  }

  return regions.map((region) => ({
    ...region,
    subRegions: getSubRegions(region, options),
  }));
};

const getTokenType = (
  chunk: string,
  { includeA = true }: WordsToNumbersOptions
): TokenType | undefined => {
  const UNIT_KEYS = getUnitKeys(includeA);
  if (UNIT_KEYS.includes(chunk.toLowerCase())) {
    return TokenType.UNIT;
  }

  if (TEN_KEYS.includes(chunk.toLowerCase())) {
    return TokenType.TEN;
  }

  if (MAGNITUDE_KEYS.includes(chunk.toLowerCase())) {
    return TokenType.MAGNITUDE;
  }

  if (DECIMALS.includes(chunk.toLowerCase())) {
    return TokenType.DECIMAL;
  }

  return undefined;
};

const parser = (text: string, options: WordsToNumbersOptions): Region[] => {
  const tokens = text
    .split(/(\w+|\s|[[:punct:]])/i)
    .reduce<Token[]>((acc, chunk) => {
      const unfuzzyChunk =
        chunk.length && options.fuzzy && !PUNCTUATION.includes(chunk)
          ? fuzzyMatch(chunk, options)
          : chunk;

      const start = acc.length ? acc[acc.length - 1].end + 1 : 0;
      const end = start + chunk.length;

      if (end !== start) {
        acc.push({
          start,
          end: end - 1,
          value: unfuzzyChunk,
          lowerCaseValue: unfuzzyChunk.toLowerCase(),
          type: getTokenType(unfuzzyChunk, options),
        });
      }

      return acc;
    }, []);

  const regions = matchRegions(tokens, options);

  return regions;
};

export default parser;
