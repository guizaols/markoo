export const titleCollator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

export function safeDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Unknown site";
  }
}

export function normalizeForSearch(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function buildSearchText(title, url, parentPath) {
  return `${title} ${url} ${parentPath}`.toLowerCase();
}

function splitWords(text) {
  return normalizeForSearch(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .slice(0, 60);
}

function isSubsequence(needle, haystack) {
  if (!needle) {
    return true;
  }

  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j += 1) {
    if (needle[i] === haystack[j]) {
      i += 1;
    }
  }

  return i === needle.length;
}

function editDistanceAtMostTwo(a, b) {
  const al = a.length;
  const bl = b.length;

  if (Math.abs(al - bl) > 2) {
    return 3;
  }

  const dp = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
  for (let i = 0; i <= al; i += 1) dp[i][0] = i;
  for (let j = 0; j <= bl; j += 1) dp[0][j] = j;

  for (let i = 1; i <= al; i += 1) {
    let rowMin = Infinity;
    for (let j = 1; j <= bl; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      rowMin = Math.min(rowMin, dp[i][j]);
    }
    if (rowMin > 2) {
      return 3;
    }
  }

  return dp[al][bl];
}

function fuzzyWordMatch(token, words) {
  if (token.length < 4) {
    return false;
  }

  for (const word of words) {
    if (!word) {
      continue;
    }

    if (word.includes(token)) {
      return true;
    }

    if (Math.abs(word.length - token.length) <= 1) {
      const distance = editDistanceAtMostTwo(token, word);
      if (distance <= 1) {
        return true;
      }
    }

    if (token.length >= 5 && isSubsequence(token, word)) {
      return true;
    }
  }

  return false;
}

function matchTokenScore(token, bookmark, words) {
  if (!token) {
    return 0;
  }

  const title = normalizeForSearch(bookmark.title);
  const domain = normalizeForSearch(bookmark.domain);
  const parent = normalizeForSearch(bookmark.parentPath);
  const searchText = bookmark.searchNormalized || normalizeForSearch(bookmark.searchText);

  if (title.startsWith(token)) return 0;
  if (title.includes(token)) return 1;
  if (domain.startsWith(token)) return 2;
  if (domain.includes(token)) return 3;
  if (parent.includes(token)) return 4;
  if (searchText.includes(token)) return 5;

  if (fuzzyWordMatch(token, words)) return 8;
  return Number.POSITIVE_INFINITY;
}

function computeMatchScore(bookmark, normalizedQuery) {
  if (!normalizedQuery) {
    return 0;
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return 0;
  }

  const words = splitWords(`${bookmark.title} ${bookmark.domain} ${bookmark.parentPath}`);
  let score = 0;

  for (const token of tokens) {
    const tokenScore = matchTokenScore(token, bookmark, words);
    if (!Number.isFinite(tokenScore)) {
      return Number.POSITIVE_INFINITY;
    }
    score += tokenScore;
  }

  return score;
}

export function filterAndSortBookmarks({
  bookmarks,
  selectedFolderId,
  query,
  sort,
  favorites,
  domainFilter,
  recencyDays
}) {
  const normalizedQuery = normalizeForSearch(query);
  const normalizedDomainFilter = normalizeForSearch(domainFilter);
  const hasDomainFilter = normalizedDomainFilter && normalizedDomainFilter !== "all";

  const days = Number(recencyDays);
  const hasRecencyFilter = Number.isFinite(days) && days > 0;
  const minDate = hasRecencyFilter ? Date.now() - days * 24 * 60 * 60 * 1000 : 0;

  const scored = [];
  for (const bookmark of bookmarks) {
    const inFolder = !selectedFolderId || bookmark.folderTrailIds.includes(selectedFolderId);
    if (!inFolder) {
      continue;
    }

    if (hasDomainFilter && normalizeForSearch(bookmark.domain) !== normalizedDomainFilter) {
      continue;
    }

    if (hasRecencyFilter && Number(bookmark.dateAdded || 0) < minDate) {
      continue;
    }

    const matchScore = computeMatchScore(bookmark, normalizedQuery);
    if (!Number.isFinite(matchScore)) {
      continue;
    }

    scored.push({ bookmark, matchScore });
  }

  const hasQuery = normalizedQuery.length > 0;
  scored.sort((left, right) => {
    const a = left.bookmark;
    const b = right.bookmark;

    if (hasQuery && left.matchScore !== right.matchScore) {
      return left.matchScore - right.matchScore;
    }

    const favDelta = Number(favorites.has(b.id)) - Number(favorites.has(a.id));
    if (favDelta !== 0) {
      return favDelta;
    }

    if (sort === "name_asc") {
      return titleCollator.compare(a.title, b.title);
    }

    if (sort === "name_desc") {
      return titleCollator.compare(b.title, a.title);
    }

    if (sort === "date_asc") {
      return a.dateAdded - b.dateAdded;
    }

    return b.dateAdded - a.dateAdded;
  });

  return scored.map((entry) => entry.bookmark);
}
