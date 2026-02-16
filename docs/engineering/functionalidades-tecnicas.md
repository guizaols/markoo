# Markoo - Funcionalidades Técnicas (Dev Guide)

Este documento descreve tecnicamente as funcionalidades da extensão, com foco em arquitetura, fluxo de dados e manutenção.

## 1. Arquitetura geral

- `manifest.json`
  - Declara MV3, permissões, comandos de teclado, `side_panel` e service worker.
- `background.js`
  - Orquestra comandos globais (quick save, abrir panel, quick capture) e configuração do side panel.
- `popup.html` + `popup.css` + `popup.js`
  - UI principal e camada de interação.
- `src/bookmark-core.js`
  - Núcleo puro e testável de busca/filtragem/ordenação.

## 2. Estado da aplicação (`popup.js`)

Estado centralizado no objeto `state`, incluindo:

- dados principais: `allBookmarks`, `folders`, `folderById`
- filtros e busca: `query`, `sort`, `domainFilter`, `recencyFilter`, `selectedFolderId`
- UX: `filtersExpanded`, `isCreatePanelOpen`, `selectedBookmarkId`
- produtividade: `selectedBookmarkIds`, `scopedBookmarkIds`, `duplicateGroupById`
- preferências: `theme`, `uiLanguage`, `density`, `showDateMeta`, `syncEnabled`
- suporte: `favorites`, `collapsedFolders`, `linkHealthById`
- performance: `searchTimer`, `filteredBookmarks`, `isVirtualized`, `virtualRange`

## 3. Modelo de dados de bookmark

Cada bookmark renderizável é enriquecido com metadados para busca e UX:

- `id`, `title`, `url`, `dateAdded`, `parentId`
- `domain` (derivado por `safeDomain`)
- `parentPath` (trilha textual de pastas)
- `folderTrailIds` (ids da árvore para filtro por pasta)
- `searchText` / `searchNormalized` (índice textual para busca)

## 4. Busca, filtros e ordenação (`src/bookmark-core.js`)

Função principal: `filterAndSortBookmarks(...)`.

### 4.1 Busca

- Normalização via `normalizeForSearch`:
  - lowercase
  - remoção de acentos (NFD)
  - trim
- Tokenização da query (múltiplas palavras)
- Score por token:
  - prioridade para match no título
  - depois domínio/pasta/texto geral
  - fallback fuzzy (subsequência + distância de edição limitada)
- Resultado final ordenado por score (quando há query).

### 4.2 Filtros

- Pasta: inclui descendentes por `folderTrailIds`
- Domínio: match exato normalizado
- Recência: corte por dias (`dateAdded >= minDate`)
- Escopo especial: duplicados (`scopedBookmarkIds`)

### 4.3 Ordenação

Quando scores empatam (ou sem query):

1. Favoritos primeiro
2. critério selecionado (`name_asc`, `name_desc`, `date_asc`, `date_desc`)

## 5. Navegação por pastas

- A árvore de pastas é derivada da API `chrome.bookmarks.getTree()`.
- O componente mantém:
  - colapso/expansão por `collapsedFolders`
  - destaque da pasta ativa
  - contagem por pasta/subárvore
- Suporta drop de bookmarks para mover entre pastas.

## 6. CRUD de bookmarks

### 6.1 Criar

- Formulário manual (`title` + `url`) em painel recolhível.
- Ação “Add current tab” usa `chrome.tabs.query` para capturar aba ativa.

### 6.2 Editar

- Overlay de edição com validação de URL.
- Persistência via `chrome.bookmarks.update`.

### 6.3 Remover

- Exclusão individual com confirmação.
- Exclusão em lote via seleção múltipla.
- Ações destrutivas possuem mecanismo de undo em fluxos suportados.

## 7. Ações em lote e duplicados

- Seleção por checkbox em cada card.
- Barra de bulk actions:
  - mover selecionados (`moveBookmarksToFolder`)
  - deletar selecionados (`deleteSelectedBookmarks`)
  - limpar seleção
- Duplicados:
  - agrupamento por chave normalizada
  - marcação de grupo (`duplicateGroupById`)
  - escopo exclusivo de visualização para “somente duplicados”

## 8. Importação e exportação

### 8.1 Exportação

- Exporta árvore completa no formato Netscape (`.html`), compatível com Chrome e outros browsers.
- Funções-chave:
  - `buildNetscapeBookmarkHtml`
  - `formatAddDateFromMs`
  - `escapeNetscapeText`

### 8.2 Importação

- Aceita:
  - Netscape HTML
  - JSON legado (modo compatibilidade)
- Fluxo:
  - parse do arquivo
  - validação e confirmação
  - recriação opcional de caminho de pastas (`ensureImportFolderPath`)
  - criação em lote com progresso/cancelamento

## 9. Link health scan

- Varredura opcional dos bookmarks visíveis.
- Armazena status em `linkHealthById`.
- UI mostra progresso e permite cancelamento.
- Resultado pode ser persistido localmente e em sync (quando habilitado).

## 10. Internacionalização (i18n)

- Dicionários em `popup.js` (`en`, `pt`, `es`).
- Modo `auto` usa locale do browser.
- `applyStaticTranslations()` aplica textos estáticos e labels de selects/botões.

## 11. Temas, densidade e preferências

- Tema via `data-theme` no `documentElement`.
- Densidade via `data-density` no `body`.
- Preferências persistidas em:
  - `chrome.storage.local` (default)
  - `chrome.storage.sync` (quando `syncEnabled = true`)

Preferências sincronizáveis:

- tema
- idioma UI
- densidade
- exibição de data
- favoritos
- cache de health

## 12. Side panel e comandos globais (`background.js`)

Comandos declarados no manifesto e tratados no service worker:

- `quick-save-current-tab`
- `open-markoo-panel`
- `quick-capture-modal`

Quick capture:

- salva payload temporário (`pendingQuickCapture`) em storage local
- abre side panel
- `popup.js` consome payload ao inicializar (`consumePendingQuickCapture`)

## 13. Performance e escalabilidade

- Debounce de busca (`SEARCH_DEBOUNCE_MS`)
- Virtualização de lista para grandes volumes (`VIRTUALIZE_THRESHOLD`)
- Overscan configurável (`VIRTUAL_OVERSCAN`)
- Benchmark local: `scripts/benchmark-search.mjs`

## 14. Testes

- Unitários: `test/unit/bookmark-core.test.js`
  - foco em busca/ordenação/filtros
- E2E smoke: `test/e2e/smoke.spec.js`
  - valida carregamento básico da UI
- Execução:
  - `npm run test:unit`
  - `npm run test:e2e`

## 15. Permissões e segurança

Permissões atuais:

- `bookmarks`, `tabs`, `storage`, `sidePanel`
- `host_permissions: <all_urls>` para health check

Diretriz:

- manter processamento de bookmarks local
- evitar envio de conteúdo sensível
- só expandir escopo de permissão com justificativa de produto/documentação

## 16. Pontos de extensão sugeridos

- incrementar score de relevância com sinais de uso
- adicionar presets de filtro salvos
- enriquecer modo duplicados (merge/keep newest)
- adicionar teste e2e de regressão de layout para cards/bulk bar
- separar i18n para arquivos dedicados (hoje embutido em `popup.js`)
