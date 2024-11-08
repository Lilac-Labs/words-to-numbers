const distance = (s1: string, s2: string): number => {
  if (typeof s1 !== "string" || typeof s2 !== "string") {
    return 0;
  }

  if (s1.length === 0 || s2.length === 0) {
    return 0;
  }

  const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2.0) - 1;
  const matches1 = new Array(s1.length);
  const matches2 = new Array(s2.length);
  let m = 0; // number of matches
  let t = 0; // number of transpositions
  let i = 0; // index for string 1
  let k = 0; // index for string 2

  // debug helpers
  // console.log("s1: " + s1 + "; s2: " + s2);
  // console.log(" - matchWindow: " + matchWindow);

  for (i = 0; i < s1.length; i += 1) {
    // loop to find matched characters
    const start = Math.max(0, i - matchWindow); // use the higher of the window diff
    const end = Math.min(i + matchWindow + 1, s2.length); // use the min of the window and string 2 length

    for (k = start; k < end; k += 1) {
      // iterate second string index
      if (matches2[k]) {
        // if second string character already matched
        continue;
      }
      if (s1[i] !== s2[k]) {
        // characters don't match
        continue;
      }

      // assume match if the above 2 checks don't continue
      matches1[i] = true;
      matches2[k] = true;
      m += 1;
      break;
    }
  }

  // nothing matched
  if (m === 0) {
    return 0.0;
  }

  k = 0; // reset string 2 index
  for (i = 0; i < s1.length; i += 1) {
    // loop to find transpositions
    if (!matches1[i]) {
      // non-matching character
      continue;
    }
    while (!matches2[k]) {
      // move k index to the next match
      k += 1;
    }
    if (s1[i] !== s2[k]) {
      // if the characters don't match, increase transposition
      // HtD: t is always less than the number of matches m, because transpositions are a subset of matches
      t += 1;
    }
    k += 1; // iterate k index normally
  }

  // transpositions divided by 2
  t = t / 2.0;

  return (m / s1.length + m / s2.length + (m - t) / m) / 3.0; // HtD: therefore, m - t > 0, and m - t < m
  // HtD: => return value is between 0 and 1
};

interface JaroWinklerOptions {
  /** If true strings are first converted to lower case before comparison */
  ignoreCase?: boolean;
}

/**
 * Computes the Winkler distance between two string -- intrepreted from:
 * http://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance
 *
 * @param string1 - The first string to compare
 * @param string2 - The second string to compare
 * @param options - Options for the Jaro-Winkler distance
 * @returns The Jaro-Winkler distance between the two strings
 *
 * Forked from [`natural`](https://github.com/NaturalNode/natural/blob/master/lib/natural/distance/jaro-winkler_distance.js)
 */
const jaroWinkler = (
  string1: string,
  string2: string,
  options: JaroWinklerOptions = {}
): number => {
  if (string1 === string2) {
    return 1;
  } else {
    let s1 = string1;
    let s2 = string2;
    if (options.ignoreCase) {
      s1 = s1.toLowerCase();
      s2 = s2.toLowerCase();
    }

    const jaro = distance(s1, s2);
    const p = 0.1; // default scaling factor
    let l = 0; // length of the matching prefix
    while (s1[l] === s2[l] && l < 4) {
      l += 1;
    }

    // HtD: 1 - jaro >= 0
    return jaro + l * p * (1 - jaro);
  }
};

export default jaroWinkler;
