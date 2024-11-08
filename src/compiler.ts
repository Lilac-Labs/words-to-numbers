import { getNumberMap } from "./constants";
import {
  type WordsToNumbersOptions,
  TokenType,
  type Region,
  type SubRegion,
} from "./types";
import { splice } from "./util";

const getNumber = (
  region: Region,
  { includeA = true }: WordsToNumbersOptions
): number => {
  const NUMBER = getNumberMap(includeA);

  let sum = 0;
  let decimalReached = false;
  const decimalUnits: SubRegion[] = [];
  region.subRegions.forEach((subRegion) => {
    const { tokens, type } = subRegion;
    let subRegionSum = 0;

    if (type === TokenType.DECIMAL) {
      decimalReached = true;
      return;
    }

    if (decimalReached) {
      decimalUnits.push(subRegion);
      return;
    }

    switch (type) {
      case TokenType.MAGNITUDE:
      case TokenType.HUNDRED: {
        subRegionSum = 1;
        const tokensCount = tokens.length;
        tokens
          .reduce<number[]>((acc, token, i) => {
            if (token.type === TokenType.HUNDRED) {
              let tokensToAdd = tokensCount - 1 ? tokens.slice(i + 1) : [];
              tokensToAdd = tokensToAdd.filter((tokenToAdd, j) => {
                if (j === 0) {
                  return true;
                }
                const previousTokenToAddType = tokensToAdd[j - 1].type;
                const tokenToAddType = tokenToAdd.type;
                return (
                  typeof previousTokenToAddType == "number" &&
                  typeof tokenToAddType === "number" &&
                  previousTokenToAddType > tokenToAddType
                );
              });

              const tokensToAddSum = tokensToAdd.reduce<number>(
                (acc2, tokenToAdd) => acc2 + NUMBER[tokenToAdd.lowerCaseValue],
                0
              );
              acc.push(tokensToAddSum + NUMBER[token.lowerCaseValue] * 100);
              return acc;
            }

            if (i > 0 && tokens[i - 1].type === TokenType.HUNDRED) {
              return acc;
            }

            if (
              i > 1 &&
              tokens[i - 1].type === TokenType.TEN &&
              tokens[i - 2].type === TokenType.HUNDRED
            ) {
              return acc;
            }
            acc.push(NUMBER[token.lowerCaseValue]);
            return acc;
          }, [])
          .forEach((numberValue) => {
            subRegionSum *= numberValue;
          });
        break;
      }

      case TokenType.UNIT:
      case TokenType.TEN: {
        tokens.forEach((token) => {
          subRegionSum += NUMBER[token.lowerCaseValue];
        });
        break;
      }

      default:
        break;
    }
    sum += subRegionSum;
  });

  let currentDecimalPlace = 1;
  decimalUnits.forEach(({ tokens }) => {
    tokens.forEach(({ lowerCaseValue }) => {
      sum += NUMBER[lowerCaseValue] / 10 ** currentDecimalPlace;
      currentDecimalPlace += 1;
    });
  });

  return sum;
};

const replaceRegionsInText = (
  regions: Region[],
  text: string,
  opts: WordsToNumbersOptions
): string => {
  let replaced = text;
  let offset = 0;
  regions.forEach((region) => {
    const length = region.end - region.start + 1;
    const replaceWith = getNumber(region, opts).toString();
    replaced = splice(replaced, region.start + offset, length, replaceWith);
    offset -= length - replaceWith.length;
  });
  return replaced;
};

interface CompilerParams {
  regions: Region[];
  text: string;
  options: WordsToNumbersOptions;
}

const compiler = ({
  regions,
  text,
  options,
}: CompilerParams): string | number => {
  if (regions[0].end - regions[0].start === text.length - 1) {
    return getNumber(regions[0], options);
  }

  return replaceRegionsInText(regions, text, options);
};

export default compiler;
