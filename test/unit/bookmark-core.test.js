import { describe, expect, it } from "vitest";
import { buildSearchText, filterAndSortBookmarks, safeDomain } from "../../src/bookmark-core.js";

describe("bookmark-core", () => {
  it("builds normalized search text", () => {
    const text = buildSearchText("My Link", "https://example.com", "Folder / Sub");
    expect(text).toBe("my link https://example.com folder / sub");
  });

  it("extracts hostname safely", () => {
    expect(safeDomain("https://www.example.com/page")).toBe("example.com");
    expect(safeDomain("invalid-url")).toBe("Unknown site");
  });

  it("filters by query and sorts by date desc with favorites first", () => {
    const bookmarks = [
      {
        id: "1",
        title: "Alpha",
        searchText: "alpha https://a.com root",
        folderTrailIds: ["x"],
        dateAdded: 10
      },
      {
        id: "2",
        title: "Beta",
        searchText: "beta https://b.com root",
        folderTrailIds: ["x"],
        dateAdded: 20
      }
    ];

    const result = filterAndSortBookmarks({
      bookmarks,
      selectedFolderId: "x",
      query: "a",
      sort: "date_desc",
      favorites: new Set(["1"])
    });

    expect(result.map((item) => item.id)).toEqual(["1", "2"]);
  });

  it("sorts by name ascending", () => {
    const bookmarks = [
      { id: "1", title: "Zulu", searchText: "", folderTrailIds: [], dateAdded: 1 },
      { id: "2", title: "Alpha", searchText: "", folderTrailIds: [], dateAdded: 2 }
    ];

    const result = filterAndSortBookmarks({
      bookmarks,
      selectedFolderId: null,
      query: "",
      sort: "name_asc",
      favorites: new Set()
    });

    expect(result.map((item) => item.title)).toEqual(["Alpha", "Zulu"]);
  });
});
