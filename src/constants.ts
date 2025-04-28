export const UNIT: Record<string, number> = {
  zero: 0,
  first: 1,
  one: 1,
  two: 2,
  third: 3,
  thirteenth: 13,
  thirteen: 13,
  three: 3,
  fourth: 4,
  fourteenth: 14,
  fourteen: 14,
  four: 4,
  fifteenth: 15,
  fifteen: 15,
  fifth: 5,
  five: 5,
  sixth: 6,
  sixteenth: 16,
  sixteen: 16,
  six: 6,
  seventeenth: 17,
  seventeen: 17,
  seventh: 7,
  seven: 7,
  eighteenth: 18,
  eighteen: 18,
  eighth: 8,
  eight: 8,
  nineteenth: 19,
  nineteen: 19,
  ninth: 9,
  nine: 9,
  tenth: 10,
  ten: 10,
  eleventh: 11,
  eleven: 11,
  twelfth: 12,
  twelve: 12,
  a: 1,
};

export const TEN: Record<string, number> = {
  twenty: 20,
  twentieth: 20,
  thirty: 30,
  thirtieth: 30,
  forty: 40,
  fortieth: 40,
  fifty: 50,
  fiftieth: 50,
  sixty: 60,
  sixtieth: 60,
  seventy: 70,
  seventieth: 70,
  eighty: 80,
  eightieth: 80,
  ninety: 90,
  ninetieth: 90,
};

export const MAGNITUDE: Record<string, number> = {
  hundred: 100,
  hundredth: 100,
  thousand: 1_000,
  million: 1_000_000,
  billion: 1_000_000_000,
  trillion: 1_000_000_000_000,
  quadrillion: 1_000_000_000_000_000,
  quintillion: 1_000_000_000_000_000_000,
  sextillion: 1_000_000_000_000_000_000_000,
  septillion: 1_000_000_000_000_000_000_000_000,
  octillion: 1_000_000_000_000_000_000_000_000_000,
  nonillion: 1_000_000_000_000_000_000_000_000_000_000,
  decillion: 1_000_000_000_000_000_000_000_000_000_000_000,
};

export const NUMBER: Record<string, number> = {
  ...UNIT,
  ...TEN,
  ...MAGNITUDE,
};

export const UNIT_KEYS = Object.keys(UNIT);
export const TEN_KEYS = Object.keys(TEN);
export const MAGNITUDE_KEYS = Object.keys(MAGNITUDE);

export const NUMBER_WORDS = [...UNIT_KEYS, ...TEN_KEYS, ...MAGNITUDE_KEYS];

export const JOINERS = ["and"];
export const DECIMALS = ["point", "dot"];

export const PUNCTUATION = [
  ".",
  ",",
  "\\",
  "#",
  "!",
  "$",
  "%",
  "^",
  "&",
  "/",
  "*",
  ";",
  ":",
  "{",
  "}",
  "=",
  "-",
  "_",
  "`",
  "~",
  "(",
  ")",
  " ",
];

export const ALL_WORDS = [...NUMBER_WORDS, ...JOINERS, ...DECIMALS];

export const BLACKLIST_SINGULAR_WORDS = ["a"];
