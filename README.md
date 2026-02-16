# Markoo

Markoo is a **Chrome Extension (Manifest V3)** focused on professional bookmark management for users with large libraries (hundreds or thousands of links).

The product is currently **100% free**.

## What Markoo does

Markoo replaces the default bookmark experience with a fast side panel designed for navigation and cleanup:

- Instant search by title, URL, domain, and folder path
- Clear folder/subfolder navigation with tree hierarchy
- Sort by date or name
- Add, edit, move, and delete bookmarks
- Bulk actions for multiple bookmarks
- Duplicate detection with scoped view (duplicates only)
- Favorites pinning for priority links
- Optional link health scan for visible items
- Import/export for migration and backup

## Core UX and productivity

- **Chrome Side Panel** experience (full height, fixed to browser side)
- Minimal default controls: search + sort visible first
- Additional filters/actions in **expand/collapse** section
- Keyboard-first workflow with shortcuts
- Command palette for quick actions
- Onboarding overlay for first-time users

## Main features

### 1. Search and filtering

- Debounced search optimized for large datasets
- Fuzzy matching (typo-tolerant behavior)
- Filters by:
  - Domain/site
  - Recency (7/30/90/365 days)
  - Folder scope
- Duplicate mode can scope the list to duplicated bookmarks only

### 2. Bookmark operations

- Create bookmark (manual form or current tab quick capture)
- Inline edit (title + URL)
- Delete with confirmation
- Drag-and-drop/move to folders
- Bulk select + bulk move + bulk delete
- Undo support for key destructive actions

### 3. Import and export

- **Export** in standard Netscape Bookmark format (`.html`), compatible with Chrome and other browsers
- **Import** from:
  - Netscape `.html` bookmarks files
  - Legacy JSON format used by previous project flows
- Import can recreate folder paths automatically

### 4. Personalization

- Multiple predefined themes (Sapphire, Graphite, Sunset, Mint)
- Density modes (Comfortable / Compact)
- Multi-language UI:
  - Auto (browser locale)
  - English
  - Portuguese
  - Spanish

### 5. Optional sync behavior

Markoo always manages bookmarks from the browser's bookmark database.

When **Sync** toggle is enabled, Markoo also stores app preferences and extension-specific metadata in `chrome.storage.sync` (when available in the user profile), including items like:

- Theme
- UI language
- Density
- Date visibility preference
- Favorite bookmark IDs
- Link health cache

## Keyboard shortcuts

Default extension commands (configurable in `chrome://extensions/shortcuts`):

- `Ctrl/Cmd + Shift + Y`: save active tab to bookmarks
- `Ctrl/Cmd + Shift + M`: open Markoo side panel
- `Ctrl/Cmd + Shift + K`: open quick capture for current tab

Inside the UI:

- `/`: focus search
- `N`: open new bookmark panel
- `Ctrl/Cmd + K`: open command palette
- `E`: edit selected bookmark
- `Del`: delete selected bookmark
- `Ctrl/Cmd + A`: select all visible bookmarks
- `Esc`: close active panel/overlay

## Tech architecture

- `manifest.json`: MV3 manifest, permissions, commands, side panel config
- `background.js`: service worker for commands and side panel behaviors
- `popup.html` + `popup.css` + `popup.js`: main UI and interaction layer
- `src/bookmark-core.js`: search/filter/sort core logic (shared, testable)
- `scripts/benchmark-search.mjs`: search performance benchmark
- `test/unit/`: unit tests (Vitest)
- `test/e2e/`: UI smoke tests (Playwright)
- `.github/workflows/ci.yml`: CI pipeline

## Permissions used

From `manifest.json`:

- `bookmarks`: read/write bookmark tree
- `tabs`: read active tab for quick-save/quick-capture
- `storage`: local and sync preferences/metadata
- `sidePanel`: open and control Chrome side panel
- `host_permissions: <all_urls>`: needed for link health checks

## Local setup

### Requirements

- Google Chrome (or Chromium with extension dev mode)
- Node.js 18+

### Install extension locally

1. Clone this repository
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the project folder (`markoo`)

## Development commands

- `npm install`
- `npm run test:unit`
- `npm run test:e2e`
- `npm run benchmark:search`

## Product and operations docs

- Product docs: `docs/product/`
- Metrics/events: `docs/metrics/funnel-events.md`
- Release/ops: `docs/ops/`
- Store listing: `docs/store/chrome-web-store-listing.md`
- Legal drafts: `legal/`
- Landing page draft: `site/index.html`

## Current status

- Free plan only (no billing)
- Focus on UX quality, reliability, and performance at scale
- Designed to evolve into a commercial-grade bookmark workspace
