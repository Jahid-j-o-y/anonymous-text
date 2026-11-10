/**
 * Offensive word filter with leetspeak normalization, repetition collapsing, and symbol stripping.
 */

export const BAD_WORDS = [
  // Common English offensive words and slurs
  "stupid",
  "idiot",
  "moron",
  "retard",
  "dumbass",
  "asshole",
  "bastard",
  "bitch",
  "bullshit",
  "cunt",
  "dick",
  "fuck",
  "fucking",
  "fucker",
  "motherfucker",
  "kill yourself",
  "die",
  "hate you",
  "nigger",
  "nigga",
  "pussy",
  "shit",
  "slut",
  "whore",
  "fag",
  "faggot",

  // Romanized Bangla offensive words
  "kutta",
  "khanki",
  "khankirmchele",
  "magi",
  "magirchele",
  "harami",
  "haramzada",
  "shala",
  "shali",
  "bokachoda",
  "boka choda",
  "chudirbhai",
  "madarchod",
  "madar chod",
  "gandu",
  "podmarani",
  "suor",
  "suorerbacha",
  "bal",
  "chodna",
];

export const OFFENSIVE_ERROR_MESSAGE =
  "Your message has offensive words. Please rewrite it politely.";

/**
 * Normalizes input text according to specification:
 * 1. lowercase
 * 2. leetspeak substitution: 0->o 1->i 3->e 4->a 5->s 7->t @->a $->s
 * 3. collapse 3+ repeated letters: e.g. "stuuupid" -> "stupid", "fuuuck" -> "fuck"
 * 4. strip symbols / punctuation
 */
export function normalizeText(text) {
  if (!text) return { normalizedWithSpaces: "", normalizedStripped: "" };

  let normalized = text.toLowerCase();

  // Leetspeak substitutions
  const leetMap = {
    "0": "o",
    "1": "i",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
    "@": "a",
    $: "s",
    "!": "i",
  };

  normalized = normalized
    .split("")
    .map((char) => leetMap[char] ?? char)
    .join("");

  // Collapse 3+ repeated characters to single (e.g. "fuuuuck" -> "fuck")
  normalized = normalized.replace(/(.)\1{2,}/g, "$1");

  // Normalized with spaces
  const normalizedWithSpaces = normalized
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Normalized completely stripped
  const normalizedStripped = normalized.replace(/[^a-z0-9]/g, "");

  return { normalizedWithSpaces, normalizedStripped };
}

/**
 * Checks whether the content contains offensive words.
 * Returns true if offensive words are found.
 */
export function containsOffensiveWords(text) {
  if (!text || !text.trim()) return false;

  const { normalizedWithSpaces, normalizedStripped } = normalizeText(text);
  const tokens = normalizedWithSpaces.split(" ").filter(Boolean);

  for (const badWord of BAD_WORDS) {
    const cleanBadWord = badWord.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!cleanBadWord) continue;

    // Check multi-word bad words (e.g., "kill yourself", "boka choda")
    if (badWord.includes(" ")) {
      if (normalizedWithSpaces.includes(badWord.toLowerCase())) {
        return true;
      }
    }

    // Exact word match in tokens
    if (tokens.includes(cleanBadWord)) {
      return true;
    }

    // Check if stripped string contains long bad words (length >= 4)
    if (cleanBadWord.length >= 4 && normalizedStripped.includes(cleanBadWord)) {
      return true;
    }

    // Word boundary regex
    const regex = new RegExp(`\\b${cleanBadWord}\\b`, "i");
    if (regex.test(normalizedWithSpaces)) {
      return true;
    }
  }

  return false;
}

