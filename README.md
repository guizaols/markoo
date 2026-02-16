# Markoo

Markoo is a Manifest V3 Chrome extension for professional bookmark management at scale.

## Product status
- 100% free
- Focused on UX, performance, and reliability

## Core product
- Fast search + folder-first navigation
- Add/edit/delete bookmarks
- Sort by name/date
- Favorites pinning
- Keyboard-first navigation

## Project assets
- Product docs: `docs/product/`
- Funnel/performance events: `docs/metrics/funnel-events.md`
- Privacy and terms drafts: `legal/`
- Store listing kit: `docs/store/chrome-web-store-listing.md`
- Landing page draft: `site/index.html`
- Unit/e2e test scaffolding + CI: `test/`, `.github/workflows/ci.yml`

## Local install
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `/Users/guizaols/projetos/dev/markoo`

## Commands
- `npm run test:unit`
- `npm run test:e2e`
- `npm run benchmark:search`
