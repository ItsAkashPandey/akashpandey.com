export type SearchField = {
  value: unknown;
  weight?: number;
};

type IndexedField = {
  text: string;
  tokens: string[];
  weight: number;
};

export type SearchDocument = IndexedField[];

export function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function createSearchDocument(fields: SearchField[]): SearchDocument {
  return fields.flatMap(({ value, weight = 1 }) => {
    const text = normalizeSearchText(value);
    return text ? [{ text, tokens: text.split(" "), weight }] : [];
  });
}

export function isOneEditAway(query: string, candidate: string) {
  if (Math.abs(query.length - candidate.length) > 1) return false;
  let queryIndex = 0;
  let candidateIndex = 0;
  let edits = 0;

  while (queryIndex < query.length && candidateIndex < candidate.length) {
    if (query[queryIndex] === candidate[candidateIndex]) {
      queryIndex += 1;
      candidateIndex += 1;
      continue;
    }

    edits += 1;
    if (edits > 1) return false;
    if (query.length > candidate.length) queryIndex += 1;
    else if (candidate.length > query.length) candidateIndex += 1;
    else {
      queryIndex += 1;
      candidateIndex += 1;
    }
  }

  return (
    edits +
      Number(queryIndex < query.length || candidateIndex < candidate.length) <=
    1
  );
}

/** Typo matching only kicks in for words long enough to be unambiguous. */
function isFuzzyMatch(queryToken: string, candidate: string) {
  return (
    queryToken.length >= 4 &&
    candidate.length >= 4 &&
    isOneEditAway(queryToken, candidate)
  );
}

function tokenScore(queryToken: string, field: IndexedField) {
  let best = 0;

  for (const candidate of field.tokens) {
    if (candidate === queryToken) best = Math.max(best, 6);
    else if (candidate.startsWith(queryToken)) best = Math.max(best, 4);
    else if (queryToken.length >= 3 && candidate.includes(queryToken)) {
      best = Math.max(best, 2.5);
    } else if (isFuzzyMatch(queryToken, candidate)) {
      best = Math.max(best, 1.5);
    }
  }

  return best * field.weight;
}

export function scoreSearchDocument(
  document: SearchDocument,
  rawQuery: string,
) {
  const query = normalizeSearchText(rawQuery);
  if (!query) return 1;

  const queryTokens = query.split(" ");
  let score = 0;

  for (const token of queryTokens) {
    const best = document.reduce(
      (current, field) => Math.max(current, tokenScore(token, field)),
      0,
    );
    if (best === 0) return 0;
    score += best;
  }

  for (const field of document) {
    if (field.text === query) score += 12 * field.weight;
    else if (field.text.startsWith(query)) score += 7 * field.weight;
    else if (field.text.includes(query)) score += 4 * field.weight;
  }

  return score;
}

/**
 * The strings to mark in `text` for a query: the query itself, its words, and
 * any word in the text that only matched through the one-typo rule above —
 * otherwise a fuzzy hit shows up in the results with nothing highlighted.
 */
export function getHighlightTerms(query: string | undefined, text = "") {
  const trimmed = query?.trim();
  if (!trimmed) return [];

  const words = trimmed.split(/\s+/).filter((word) => word.length > 1);
  const terms = new Set([trimmed, ...words].map((term) => term.toLowerCase()));

  const queryTokens = normalizeSearchText(trimmed).split(" ");
  for (const word of text.match(/[\p{L}\p{N}]+/gu) ?? []) {
    const token = normalizeSearchText(word);
    if (
      queryTokens.some(
        (queryToken) =>
          !token.includes(queryToken) && isFuzzyMatch(queryToken, token),
      )
    ) {
      terms.add(word.toLowerCase());
    }
  }

  return Array.from(terms).sort((a, b) => b.length - a.length);
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A case-insensitive matcher for the terms, or null when there are none. */
export function highlightMatcher(terms: string[]) {
  return terms.length
    ? new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi")
    : null;
}
