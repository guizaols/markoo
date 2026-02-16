import { buildSearchText, filterAndSortBookmarks, safeDomain } from "../src/bookmark-core.js";

function makeBookmarks(count) {
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const title = `Bookmark ${i} topic ${(i % 97) + 1}`;
    const url = `https://example${i % 250}.com/path/${i}`;
    const parentPath = `Root / Folder ${i % 40} / Sub ${(i * 7) % 30}`;
    list.push({
      id: String(i),
      title,
      url,
      domain: safeDomain(url),
      parentPath,
      folderTrailIds: [String(i % 40), String((i * 7) % 30)],
      dateAdded: Date.now() - i * 5000,
      searchText: buildSearchText(title, url, parentPath)
    });
  }
  return list;
}

function runCase({ total, query, sort }) {
  const bookmarks = makeBookmarks(total);
  const favorites = new Set(["10", "30", "50", "70", "90"]);

  const startedAt = performance.now();
  const result = filterAndSortBookmarks({
    bookmarks,
    selectedFolderId: null,
    query,
    sort,
    favorites
  });
  const durationMs = performance.now() - startedAt;

  return {
    total,
    query,
    sort,
    resultCount: result.length,
    durationMs: Math.round(durationMs * 100) / 100
  };
}

const cases = [
  { total: 2000, query: "bookmark", sort: "date_desc" },
  { total: 5000, query: "topic 8", sort: "name_asc" },
  { total: 10000, query: "example12", sort: "date_desc" }
];

const results = cases.map(runCase);
console.table(results);
