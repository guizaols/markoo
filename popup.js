import { buildSearchText, filterAndSortBookmarks, normalizeForSearch, safeDomain } from "./src/bookmark-core.js";

const SEARCH_DEBOUNCE_MS = 120;
const VIRTUALIZE_THRESHOLD = 300;
const VIRTUAL_ROW_HEIGHT = 96;
const VIRTUAL_OVERSCAN = 8;

const state = {
  allBookmarks: [],
  folders: [],
  favorites: new Set(),
  selectedBookmarkIds: new Set(),
  collapsedFolders: new Set(),
  query: "",
  sort: "date_desc",
  domainFilter: "all",
  recencyFilter: "all",
  selectedFolderId: null,
  preferredFolderId: null,
  isCreatePanelOpen: false,
  searchTimer: null,
  renderToken: 0,
  analyticsEnabled: true,
  hasTrackedFirstSearch: false,
  filteredBookmarks: [],
  selectedBookmarkId: null,
  theme: "sapphire",
  searchDurations: [],
  isVirtualized: false,
  virtualRange: { start: 0, end: 0 },
  folderById: new Map(),
  folderChildrenCount: new Map(),
  domainOptions: [],
  locale: "en",
  uiLanguage: "auto",
  syncEnabled: false,
  density: "comfortable",
  showDateMeta: false,
  healthFilter: "all",
  linkHealthById: {},
  scopedBookmarkIds: null,
  duplicateGroupById: new Map(),
  commandPaletteOpen: false,
  paletteActions: [],
  paletteActiveIndex: 0,
  undoActionToken: 0,
  isScanning: false,
  scanAbortRequested: false,
  isImporting: false,
  importAbortRequested: false,
  editingBookmarkId: null,
  lastFocusedElement: null,
  onboardingCompleted: false,
  filtersExpanded: false
};

const els = {
  searchInput: document.getElementById("searchInput"),
  sortSelect: document.getElementById("sortSelect"),
  domainFilter: document.getElementById("domainFilter"),
  recencyFilter: document.getElementById("recencyFilter"),
  healthFilter: document.getElementById("healthFilter"),
  scanVisibleBtn: document.getElementById("scanVisibleBtn"),
  densitySelect: document.getElementById("densitySelect"),
  showDateMeta: document.getElementById("showDateMeta"),
  showDateMetaLabel: document.getElementById("showDateMetaLabel"),
  toggleFiltersBtn: document.getElementById("toggleFiltersBtn"),
  advancedFilters: document.getElementById("advancedFilters"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFileInput: document.getElementById("importFileInput"),
  syncEnabled: document.getElementById("syncEnabled"),
  syncLabel: document.getElementById("syncLabel"),
  toggleCreateBtn: document.getElementById("toggleCreateBtn"),
  createPanel: document.getElementById("createPanel"),
  bookmarkTabBtn: document.getElementById("bookmarkTabBtn"),
  createForm: document.getElementById("createForm"),
  newTitle: document.getElementById("newTitle"),
  newUrl: document.getElementById("newUrl"),
  bookmarkList: document.getElementById("bookmarkList"),
  folderList: document.getElementById("folderList"),
  countLabel: document.getElementById("countLabel"),
  selectedFolderLabel: document.getElementById("selectedFolderLabel"),
  refreshBtn: document.getElementById("refreshBtn"),
  themeMenuBtn: document.getElementById("themeMenuBtn"),
  themeMenu: document.getElementById("themeMenu"),
  themeMenuLabel: document.getElementById("themeMenuLabel"),
  themeMenuPrefix: document.getElementById("themeMenuPrefix"),
  languageSelect: document.getElementById("languageSelect"),
  bulkBar: document.getElementById("bulkBar"),
  selectedCount: document.getElementById("selectedCount"),
  moveFolderSelect: document.getElementById("moveFolderSelect"),
  moveSelectedBtn: document.getElementById("moveSelectedBtn"),
  findDuplicatesBtn: document.getElementById("findDuplicatesBtn"),
  showAllBtn: document.getElementById("showAllBtn"),
  deleteSelectedBtn: document.getElementById("deleteSelectedBtn"),
  clearSelectionBtn: document.getElementById("clearSelectionBtn"),
  eyebrow: document.getElementById("eyebrow"),
  uxHint: document.getElementById("uxHint"),
  panelHint: document.getElementById("panelHint"),
  createSubmitBtn: document.getElementById("createSubmitBtn"),
  foldersHeading: document.getElementById("foldersHeading"),
  bookmarksHeading: document.getElementById("bookmarksHeading"),
  itemTemplate: document.getElementById("bookmarkItemTemplate"),
  toast: document.getElementById("toast"),
  commandPaletteOverlay: document.getElementById("commandPaletteOverlay"),
  commandPaletteClose: document.getElementById("commandPaletteClose"),
  commandPaletteInput: document.getElementById("commandPaletteInput"),
  commandPaletteList: document.getElementById("commandPaletteList"),
  commandPaletteTitle: document.getElementById("commandPaletteTitle"),
  onboardingOverlay: document.getElementById("onboardingOverlay"),
  onboardingEyebrow: document.getElementById("onboardingEyebrow"),
  onboardingTitle: document.getElementById("onboardingTitle"),
  onboardingStep1: document.getElementById("onboardingStep1"),
  onboardingStep2: document.getElementById("onboardingStep2"),
  onboardingStep3: document.getElementById("onboardingStep3"),
  onboardingStart: document.getElementById("onboardingStart"),
  onboardingImport: document.getElementById("onboardingImport"),
  editOverlay: document.getElementById("editOverlay"),
  editForm: document.getElementById("editForm"),
  editTitleHeading: document.getElementById("editTitleHeading"),
  editCancelBtn: document.getElementById("editCancelBtn"),
  editTitleInput: document.getElementById("editTitleInput"),
  editUrlInput: document.getElementById("editUrlInput"),
  editSaveBtn: document.getElementById("editSaveBtn")
};

const I18N = {
  en: {
    eyebrow: "Chrome Extension",
    theme: "Theme",
    refresh: "Refresh",
    refreshTitle: "Refresh bookmarks",
    language: "Language",
    languageAuto: "Auto",
    languageEnglish: "English",
    languagePortuguese: "Portuguese",
    languageSpanish: "Spanish",
    searchPlaceholder: "Search title, URL, or folder",
    sortTitle: "Sort bookmarks",
    sortDateNewest: "Date (newest)",
    sortDateOldest: "Date (oldest)",
    sortNameAsc: "Name (A-Z)",
    sortNameDesc: "Name (Z-A)",
    filterBySite: "Filter by site",
    filterByRecency: "Filter by recency",
    allSites: "All sites",
    anyTime: "Any time",
    last7: "Last 7 days",
    last30: "Last 30 days",
    last90: "Last 90 days",
    last365: "Last year",
    filterByHealth: "Filter by link health",
    allHealth: "All health",
    needsReview: "Needs review",
    healthOk: "Healthy",
    healthRedirect: "Redirect",
    healthBroken: "Broken",
    healthStale: "Stale",
    healthUnknown: "Unknown",
    scanVisible: "Scan visible",
    scanningLinks: "Scanning links...",
    scanDoneOne: "Scanned {count} link",
    scanDoneMany: "Scanned {count} links",
    densityComfortable: "Density: Comfortable",
    densityCompact: "Density: Compact",
    showDate: "Show date",
    exportData: "Export",
    importData: "Import",
    importConfirm: "Import {count} bookmarks?",
    importInvalid: "Invalid import file",
    importDoneOne: "Imported {count} bookmark",
    importDoneMany: "Imported {count} bookmarks",
    sync: "Sync",
    syncEnabledMsg: "Sync enabled",
    syncDisabledMsg: "Sync disabled",
    targetFolder: "Target folder",
    newBookmark: "New bookmark",
    close: "Close",
    shortcutsHtml: "Shortcuts: <kbd>/</kbd> search, <kbd>N</kbd> new, <kbd>Esc</kbd> close panel, <kbd>Ctrl/Cmd+K</kbd> command, <kbd>E</kbd> edit, <kbd>Del</kbd> delete, <kbd>Ctrl/Cmd+A</kbd> select all visible",
    quickActions: "Quick actions",
    addCurrentTab: "Add current tab",
    titlePlaceholder: "Title",
    addBookmark: "Add bookmark",
    folders: "Folders",
    bookmarks: "Bookmarks",
    moveSelected: "Move selected",
    findDuplicates: "Find duplicates",
    showAll: "Show all",
    deleteSelected: "Delete selected",
    clear: "Clear",
    moveSelectedTitle: "Move selected to folder",
    selectForBatch: "Select for batch actions",
    toggleFavorite: "Toggle favorite",
    editBookmark: "Edit bookmark",
    deleteBookmark: "Delete bookmark",
    failedLoad: "Failed to load bookmarks",
    refreshed: "Bookmarks refreshed",
    titleUrlRequired: "Title and URL are required",
    invalidUrl: "URL is invalid",
    created: "Bookmark created",
    chooseFolder: "Choose a folder first",
    editTitle: "Edit title",
    editUrl: "Edit URL",
    updated: "Bookmark updated",
    deleteConfirm: "Delete bookmark \"{title}\"?",
    removed: "Bookmark removed",
    noBookmarksTitle: "No bookmarks yet",
    noBookmarksSubtitle: "Start by adding the current tab or creating your first bookmark.",
    createBookmark: "Create bookmark",
    noResultsTitle: "No results found",
    noResultsSubtitle: "Try another keyword or clear your current filters.",
    clearFilters: "Clear filters",
    moreFilters: "More filters",
    lessFilters: "Less filters",
    allBookmarks: "All bookmarks",
    allFolders: "All folders",
    couldNotReadTab: "Could not read active tab",
    currentTabBookmarked: "Current tab bookmarked",
    itemOne: "{count} item",
    itemMany: "{count} items",
    selectedLabel: "{count} selected",
    showingDuplicates: "Showing duplicates only",
    movedOne: "Moved {count} bookmark",
    movedMany: "Moved {count} bookmarks",
    noDuplicatesFound: "No duplicates found",
    duplicatesSelectedOne: "Selected {count} duplicate",
    duplicatesSelectedMany: "Selected {count} duplicates",
    deleteSelectedConfirm: "Delete {count} selected bookmarks?",
    deletedSelectedOne: "Deleted {count} bookmark",
    deletedSelectedMany: "Deleted {count} bookmarks",
    commandPalette: "Command palette",
    commandPlaceholder: "Type an action",
    commandNoResults: "No actions found",
    commandSearch: "Focus search",
    commandNewBookmark: "Open new bookmark form",
    commandFindDuplicates: "Find duplicates",
    commandShowAll: "Show all bookmarks",
    commandRefresh: "Refresh bookmarks",
    commandClearFilters: "Clear filters",
    quickStart: "Quick start",
    onboardingTitle: "Welcome to Markoo",
    onboardingStep1: "Search instantly by title, URL, or folder",
    onboardingStep2: "Use Ctrl/Cmd+K to run quick actions",
    onboardingStep3: "Find duplicates and clean in batch",
    onboardingStart: "Start",
    onboardingImport: "Import bookmarks",
    duplicateGroup: "Group {index} • {count} items",
    undo: "Undo",
    restoredOne: "Restored {count} bookmark",
    restoredMany: "Restored {count} bookmarks",
    scanningLinks: "Scanning links...",
    scanProgress: "Scanning links: {done}/ {total}",
    scanCanceled: "Scan canceled",
    stopScan: "Stop scan",
    importProgress: "Importing bookmarks: {done}/ {total}",
    importCanceled: "Import canceled",
    cancelImport: "Cancel import",
    editInlineTitle: "Edit bookmark",
    editCancel: "Cancel",
    editSave: "Save",
    shortcutsQuickHelp: "Shortcuts: / search, N new, Ctrl/Cmd+K commands"
  },
  pt: {
    eyebrow: "Extensao Chrome",
    theme: "Tema",
    refresh: "Atualizar",
    refreshTitle: "Atualizar favoritos",
    language: "Idioma",
    languageAuto: "Automatico",
    languageEnglish: "Ingles",
    languagePortuguese: "Portugues",
    languageSpanish: "Espanhol",
    searchPlaceholder: "Buscar titulo, URL ou pasta",
    sortTitle: "Ordenar favoritos",
    sortDateNewest: "Data (mais recente)",
    sortDateOldest: "Data (mais antiga)",
    sortNameAsc: "Nome (A-Z)",
    sortNameDesc: "Nome (Z-A)",
    filterBySite: "Filtrar por site",
    filterByRecency: "Filtrar por periodo",
    allSites: "Todos os sites",
    anyTime: "Qualquer periodo",
    last7: "Ultimos 7 dias",
    last30: "Ultimos 30 dias",
    last90: "Ultimos 90 dias",
    last365: "Ultimo ano",
    filterByHealth: "Filtrar por saude do link",
    allHealth: "Toda saude",
    needsReview: "Precisa revisao",
    healthOk: "Saudavel",
    healthRedirect: "Redireciona",
    healthBroken: "Quebrado",
    healthStale: "Antigo",
    healthUnknown: "Desconhecido",
    scanVisible: "Escanear visiveis",
    scanningLinks: "Escaneando links...",
    scanDoneOne: "{count} link escaneado",
    scanDoneMany: "{count} links escaneados",
    densityComfortable: "Densidade: Confortavel",
    densityCompact: "Densidade: Compacta",
    showDate: "Mostrar data",
    exportData: "Exportar",
    importData: "Importar",
    importConfirm: "Importar {count} favoritos?",
    importInvalid: "Arquivo de importacao invalido",
    importDoneOne: "{count} favorito importado",
    importDoneMany: "{count} favoritos importados",
    sync: "Sync",
    syncEnabledMsg: "Sync ativado",
    syncDisabledMsg: "Sync desativado",
    targetFolder: "Pasta alvo",
    newBookmark: "Novo favorito",
    close: "Fechar",
    shortcutsHtml: "Atalhos: <kbd>/</kbd> buscar, <kbd>N</kbd> novo, <kbd>Esc</kbd> fechar painel, <kbd>Ctrl/Cmd+K</kbd> comandos, <kbd>E</kbd> editar, <kbd>Del</kbd> excluir, <kbd>Ctrl/Cmd+A</kbd> selecionar visiveis",
    quickActions: "Acoes rapidas",
    addCurrentTab: "Salvar aba atual",
    titlePlaceholder: "Titulo",
    addBookmark: "Adicionar favorito",
    folders: "Pastas",
    bookmarks: "Favoritos",
    moveSelected: "Mover selecionados",
    findDuplicates: "Encontrar duplicados",
    showAll: "Mostrar todos",
    deleteSelected: "Excluir selecionados",
    clear: "Limpar",
    moveSelectedTitle: "Mover selecionados para pasta",
    selectForBatch: "Selecionar para acoes em lote",
    toggleFavorite: "Alternar favorito",
    editBookmark: "Editar favorito",
    deleteBookmark: "Excluir favorito",
    failedLoad: "Falha ao carregar favoritos",
    refreshed: "Favoritos atualizados",
    titleUrlRequired: "Titulo e URL sao obrigatorios",
    invalidUrl: "URL invalida",
    created: "Favorito criado",
    chooseFolder: "Escolha uma pasta primeiro",
    editTitle: "Editar titulo",
    editUrl: "Editar URL",
    updated: "Favorito atualizado",
    deleteConfirm: "Excluir favorito \"{title}\"?",
    removed: "Favorito removido",
    noBookmarksTitle: "Nenhum favorito ainda",
    noBookmarksSubtitle: "Comece adicionando a aba atual ou criando seu primeiro favorito.",
    createBookmark: "Criar favorito",
    noResultsTitle: "Nenhum resultado encontrado",
    noResultsSubtitle: "Tente outra palavra-chave ou limpe os filtros atuais.",
    clearFilters: "Limpar filtros",
    moreFilters: "Mais filtros",
    lessFilters: "Menos filtros",
    allBookmarks: "Todos os favoritos",
    allFolders: "Todas as pastas",
    couldNotReadTab: "Nao foi possivel ler a aba ativa",
    currentTabBookmarked: "Aba atual salva",
    itemOne: "{count} item",
    itemMany: "{count} itens",
    selectedLabel: "{count} selecionados",
    showingDuplicates: "Mostrando apenas duplicados",
    movedOne: "{count} favorito movido",
    movedMany: "{count} favoritos movidos",
    noDuplicatesFound: "Nenhum duplicado encontrado",
    duplicatesSelectedOne: "{count} duplicado selecionado",
duplicatesSelectedMany: "{count} duplicados selecionados",
    deleteSelectedConfirm: "Excluir {count} favoritos selecionados?",
    deletedSelectedOne: "{count} favorito excluido",
    deletedSelectedMany: "{count} favoritos excluidos",
    commandPalette: "Paleta de comandos",
    commandPlaceholder: "Digite uma acao",
    commandNoResults: "Nenhuma acao encontrada",
    commandSearch: "Focar busca",
    commandNewBookmark: "Abrir formulario de novo favorito",
    commandFindDuplicates: "Encontrar duplicados",
    commandShowAll: "Mostrar todos os favoritos",
    commandRefresh: "Atualizar favoritos",
    commandClearFilters: "Limpar filtros",
    quickStart: "Inicio rapido",
    onboardingTitle: "Bem-vindo ao Markoo",
    onboardingStep1: "Busque por titulo, URL ou pasta em tempo real",
    onboardingStep2: "Use Ctrl/Cmd+K para abrir comandos rapidos",
    onboardingStep3: "Encontre duplicados e limpe em lote",
    onboardingStart: "Comecar",
    onboardingImport: "Importar favoritos",
    duplicateGroup: "Grupo {index} • {count} itens",
    undo: "Desfazer",
    restoredOne: "{count} favorito restaurado",
    restoredMany: "{count} favoritos restaurados",
    scanProgress: "Escaneando links: {done}/ {total}",
    scanCanceled: "Escaneamento cancelado",
    stopScan: "Parar escaneamento",
    importProgress: "Importando favoritos: {done}/ {total}",
    importCanceled: "Importacao cancelada",
    cancelImport: "Cancelar importacao",
    editInlineTitle: "Editar favorito",
    editCancel: "Cancelar",
    editSave: "Salvar",
    shortcutsQuickHelp: "Atalhos: / buscar, N novo, Ctrl/Cmd+K comandos"
  },
  es: {
    eyebrow: "Extension de Chrome",
    theme: "Tema",
    refresh: "Actualizar",
    refreshTitle: "Actualizar marcadores",
    language: "Idioma",
    languageAuto: "Automatico",
    languageEnglish: "Ingles",
    languagePortuguese: "Portugues",
    languageSpanish: "Espanol",
    searchPlaceholder: "Buscar titulo, URL o carpeta",
    sortTitle: "Ordenar marcadores",
    sortDateNewest: "Fecha (mas reciente)",
    sortDateOldest: "Fecha (mas antigua)",
    sortNameAsc: "Nombre (A-Z)",
    sortNameDesc: "Nombre (Z-A)",
    filterBySite: "Filtrar por sitio",
    filterByRecency: "Filtrar por periodo",
    allSites: "Todos los sitios",
    anyTime: "Cualquier periodo",
    last7: "Ultimos 7 dias",
    last30: "Ultimos 30 dias",
    last90: "Ultimos 90 dias",
    last365: "Ultimo ano",
    targetFolder: "Carpeta destino",
    filterByHealth: "Filtrar salud del link",
    allHealth: "Toda salud",
    needsReview: "Necesita revision",
    healthOk: "Saludable",
    healthRedirect: "Redirige",
    healthBroken: "Roto",
    healthStale: "Antiguo",
    healthUnknown: "Desconocido",
    scanVisible: "Escanear visibles",
    scanningLinks: "Escaneando links...",
    scanDoneOne: "{count} link escaneado",
    scanDoneMany: "{count} links escaneados",
    densityComfortable: "Densidad: Confort",
    densityCompact: "Densidad: Compacta",
    showDate: "Mostrar fecha",
    exportData: "Exportar",
    importData: "Importar",
    importConfirm: "Importar {count} marcadores?",
    importInvalid: "Archivo de importacion invalido",
    importDoneOne: "{count} marcador importado",
    importDoneMany: "{count} marcadores importados",
    sync: "Sync",
    syncEnabledMsg: "Sync activado",
    syncDisabledMsg: "Sync desactivado",
    newBookmark: "Nuevo marcador",
    close: "Cerrar",
    shortcutsHtml: "Atajos: <kbd>/</kbd> buscar, <kbd>N</kbd> nuevo, <kbd>Esc</kbd> cerrar panel, <kbd>Ctrl/Cmd+K</kbd> comandos, <kbd>E</kbd> editar, <kbd>Del</kbd> eliminar, <kbd>Ctrl/Cmd+A</kbd> seleccionar visibles",
    quickActions: "Acciones rapidas",
    addCurrentTab: "Guardar pestana actual",
    titlePlaceholder: "Titulo",
    addBookmark: "Agregar marcador",
    folders: "Carpetas",
    bookmarks: "Marcadores",
    moveSelected: "Mover seleccionados",
    findDuplicates: "Encontrar duplicados",
    showAll: "Mostrar todo",
    deleteSelected: "Eliminar seleccionados",
    clear: "Limpiar",
    moveSelectedTitle: "Mover seleccionados a carpeta",
    selectForBatch: "Seleccionar para acciones en lote",
    toggleFavorite: "Alternar favorito",
    editBookmark: "Editar marcador",
    deleteBookmark: "Eliminar marcador",
    failedLoad: "Error al cargar marcadores",
    refreshed: "Marcadores actualizados",
    titleUrlRequired: "Titulo y URL son obligatorios",
    invalidUrl: "URL invalida",
    created: "Marcador creado",
    chooseFolder: "Elige una carpeta primero",
    editTitle: "Editar titulo",
    editUrl: "Editar URL",
    updated: "Marcador actualizado",
    deleteConfirm: "Eliminar marcador \"{title}\"?",
    removed: "Marcador eliminado",
    noBookmarksTitle: "Aun no hay marcadores",
    noBookmarksSubtitle: "Comienza agregando la pestana actual o creando tu primer marcador.",
    createBookmark: "Crear marcador",
    noResultsTitle: "No se encontraron resultados",
    noResultsSubtitle: "Prueba otra palabra clave o limpia los filtros actuales.",
    clearFilters: "Limpiar filtros",
    moreFilters: "Mas filtros",
    lessFilters: "Menos filtros",
    allBookmarks: "Todos los marcadores",
    allFolders: "Todas las carpetas",
    couldNotReadTab: "No se pudo leer la pestana activa",
    currentTabBookmarked: "Pestana actual guardada",
    itemOne: "{count} elemento",
    itemMany: "{count} elementos",
    selectedLabel: "{count} seleccionados",
    showingDuplicates: "Mostrando solo duplicados",
    movedOne: "Se movio {count} marcador",
    movedMany: "Se movieron {count} marcadores",
    noDuplicatesFound: "No se encontraron duplicados",
    duplicatesSelectedOne: "{count} duplicado seleccionado",
    duplicatesSelectedMany: "{count} duplicados seleccionados",
    deleteSelectedConfirm: "Eliminar {count} marcadores seleccionados?",
    deletedSelectedOne: "Se elimino {count} marcador",
    deletedSelectedMany: "Se eliminaron {count} marcadores",
    commandPalette: "Paleta de comandos",
    commandPlaceholder: "Escribe una accion",
    commandNoResults: "No se encontraron acciones",
    commandSearch: "Enfocar busqueda",
    commandNewBookmark: "Abrir formulario de nuevo marcador",
    commandFindDuplicates: "Encontrar duplicados",
    commandShowAll: "Mostrar todos los marcadores",
    commandRefresh: "Actualizar marcadores",
    commandClearFilters: "Limpiar filtros",
    quickStart: "Inicio rapido",
    onboardingTitle: "Bienvenido a Markoo",
    onboardingStep1: "Busca por titulo, URL o carpeta al instante",
    onboardingStep2: "Usa Ctrl/Cmd+K para acciones rapidas",
    onboardingStep3: "Encuentra duplicados y limpia en lote",
    onboardingStart: "Comenzar",
    onboardingImport: "Importar marcadores",
    duplicateGroup: "Grupo {index} • {count} elementos",
    undo: "Deshacer",
    restoredOne: "Se restauro {count} marcador",
    restoredMany: "Se restauraron {count} marcadores",
    scanProgress: "Escaneando links: {done}/ {total}",
    scanCanceled: "Escaneo cancelado",
    stopScan: "Detener escaneo",
    importProgress: "Importando marcadores: {done}/ {total}",
    importCanceled: "Importacion cancelada",
    cancelImport: "Cancelar importacion",
    editInlineTitle: "Editar marcador",
    editCancel: "Cancelar",
    editSave: "Guardar",
    shortcutsQuickHelp: "Atajos: / buscar, N nuevo, Ctrl/Cmd+K comandos"
  }
};

function detectLocale() {
  const lang = (navigator.language || "en").toLowerCase();
  if (lang.startsWith("pt")) return "pt";
  if (lang.startsWith("es")) return "es";
  return "en";
}

function resolveLocale(uiLanguage) {
  if (uiLanguage === "pt" || uiLanguage === "en" || uiLanguage === "es") {
    return uiLanguage;
  }
  return detectLocale();
}

function t(key, vars = {}) {
  const dict = I18N[state.locale] || I18N.en;
  const template = dict[key] || I18N.en[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
}

function formatItemCount(count) {
  return count === 1 ? t("itemOne", { count }) : t("itemMany", { count });
}

function formatMovedCount(count) {
  return count === 1 ? t("movedOne", { count }) : t("movedMany", { count });
}

function formatDuplicateSelectionCount(count) {
  return count === 1 ? t("duplicatesSelectedOne", { count }) : t("duplicatesSelectedMany", { count });
}

function formatDeletedSelectionCount(count) {
  return count === 1 ? t("deletedSelectedOne", { count }) : t("deletedSelectedMany", { count });
}

function formatScanDoneCount(count) {
  return count === 1 ? t("scanDoneOne", { count }) : t("scanDoneMany", { count });
}

function formatRestoredCount(count) {
  return count === 1 ? t("restoredOne", { count }) : t("restoredMany", { count });
}

function getHealthEntry(bookmarkId) {
  return state.linkHealthById[String(bookmarkId)] || null;
}

function getBookmarkHealthStatus(bookmark) {
  const entry = getHealthEntry(bookmark.id);
  const addedAt = Number(bookmark.dateAdded || 0);
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;

  if (!entry) {
    if (addedAt > 0 && Date.now() - addedAt > oneYearMs) {
      return "stale";
    }
    return "unknown";
  }

  if (entry.status === "broken") return "broken";
  if (entry.status === "redirect") return "redirect";
  if (entry.status === "ok") {
    const checkedAt = Number(entry.checkedAt || 0);
    if (checkedAt > 0 && Date.now() - checkedAt > oneYearMs) {
      return "stale";
    }
    return "ok";
  }

  return "unknown";
}

function matchesHealthFilter(status, filter) {
  if (!filter || filter === "all") {
    return true;
  }
  if (filter === "needs_review") {
    return status === "broken" || status === "redirect" || status === "stale" || status === "unknown";
  }
  return status === filter;
}

async function persistUserPreferences() {
  const payload = {
    density: state.density,
    showDateMeta: state.showDateMeta,
    uiLanguage: state.uiLanguage,
    theme: state.theme,
    syncEnabled: state.syncEnabled
  };

  await chrome.storage.local.set(payload);
  if (state.syncEnabled) {
    await chrome.storage.sync.set(payload);
  }
}

async function persistLinkHealth() {
  const payload = { linkHealthById: state.linkHealthById };
  await chrome.storage.local.set(payload);
  if (state.syncEnabled) {
    await chrome.storage.sync.set(payload);
  }
}

async function scanVisibleBookmarkLinks() {
  if (state.isScanning) {
    state.scanAbortRequested = true;
    showToast(t("scanCanceled"));
    return;
  }

  const ids = state.filteredBookmarks.slice(0, 400).map((bookmark) => bookmark.id);
  if (ids.length === 0) {
    return;
  }

  state.isScanning = true;
  state.scanAbortRequested = false;
  syncActionButtons();

  const index = new Map(state.allBookmarks.map((bookmark) => [bookmark.id, bookmark]));
  let scanned = 0;

  try {
    showToast(t("scanningLinks"));
    for (const id of ids) {
      if (state.scanAbortRequested) {
        break;
      }

      const bookmark = index.get(id);
      if (!bookmark?.url) {
        continue;
      }

      let status = "unknown";
      let httpStatus = 0;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(bookmark.url, { method: "GET", redirect: "follow", signal: controller.signal });
        clearTimeout(timeoutId);

        httpStatus = response.status || 0;
        if (response.ok) {
          status = response.redirected ? "redirect" : "ok";
        } else {
          status = httpStatus >= 400 ? "broken" : "redirect";
        }
      } catch {
        status = "broken";
      }

      state.linkHealthById[String(id)] = {
        status,
        httpStatus,
        checkedAt: Date.now()
      };

      scanned += 1;
      if (scanned % 20 === 0 || scanned === ids.length) {
        showToast(t("scanProgress", { done: scanned, total: ids.length }));
      }
    }

    await persistLinkHealth();
    renderBookmarks();

    if (state.scanAbortRequested) {
      showToast(t("scanCanceled"));
    } else {
      showToast(formatScanDoneCount(scanned));
    }
  } finally {
    state.isScanning = false;
    state.scanAbortRequested = false;
    syncActionButtons();
  }
}


async function exportBookmarksData() {
  const tree = await chrome.bookmarks.getTree();
  const html = buildNetscapeBookmarkHtml(tree[0]);

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "markoo-bookmarks-" + Date.now() + ".html";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function escapeNetscapeText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function formatAddDateFromMs(value) {
  const asNumber = Number(value || 0);
  if (!Number.isFinite(asNumber) || asNumber <= 0) {
    return String(Math.floor(Date.now() / 1000));
  }
  return String(Math.floor(asNumber / 1000));
}

function buildNetscapeBookmarkHtml(rootNode) {
  const lines = [
    "<!DOCTYPE NETSCAPE-Bookmark-file-1>",
    "<!-- This is an automatically generated file. -->",
    "<META HTTP-EQUIV=\"Content-Type\" CONTENT=\"text/html; charset=UTF-8\">",
    "<TITLE>Bookmarks</TITLE>",
    "<H1>Bookmarks</H1>",
    "<DL><p>"
  ];

  function walkFolder(node, depth) {
    if (!Array.isArray(node.children)) {
      return;
    }

    const pad = "  ".repeat(depth);
    for (const child of node.children) {
      if (child.url) {
        lines.push(
          `${pad}<DT><A HREF=\"${escapeNetscapeText(child.url)}\" ADD_DATE=\"${formatAddDateFromMs(child.dateAdded)}\">${escapeNetscapeText(child.title || "(untitled)")}</A>`
        );
        continue;
      }

      lines.push(
        `${pad}<DT><H3 ADD_DATE=\"${formatAddDateFromMs(child.dateAdded)}\" LAST_MODIFIED=\"${formatAddDateFromMs(child.dateGroupModified || child.dateAdded)}\">${escapeNetscapeText(child.title || "(untitled folder)")}</H3>`
      );
      lines.push(`${pad}<DL><p>`);
      walkFolder(child, depth + 1);
      lines.push(`${pad}</DL><p>`);
    }
  }

  walkFolder(rootNode, 1);
  lines.push("</DL><p>");
  return lines.join("\n");
}

function collectLegacyImportItems(raw) {
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed?.bookmarks) ? parsed.bookmarks : [];

  return items
    .map((item) => ({
      title: String(item?.title || "").trim(),
      url: String(item?.url || "").trim(),
      folderPath: String(item?.parentPath || "")
        .split("/")
        .map((segment) => segment.trim())
        .filter(Boolean)
    }))
    .filter((item) => item.title && item.url);
}

function collectNetscapeImportItems(raw) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, "text/html");
  const rootDl = doc.querySelector("DL");
  if (!rootDl) {
    return [];
  }

  const items = [];

  function parseDl(dlNode, path) {
    const children = Array.from(dlNode.children || []);

    for (let index = 0; index < children.length; index += 1) {
      const node = children[index];
      if (node.tagName !== "DT") {
        continue;
      }

      const link = node.querySelector(":scope > A");
      if (link) {
        const title = String(link.textContent || "").trim();
        const url = String(link.getAttribute("HREF") || link.href || "").trim();
        if (title && url) {
          items.push({ title, url, folderPath: [...path] });
        }
        continue;
      }

      const folder = node.querySelector(":scope > H3");
      if (!folder) {
        continue;
      }

      const folderTitle = String(folder.textContent || "").trim() || "Imported";
      let nestedDl = null;
      for (let nextIndex = index + 1; nextIndex < children.length; nextIndex += 1) {
        const sibling = children[nextIndex];
        if (sibling.tagName === "DL") {
          nestedDl = sibling;
          break;
        }
        if (sibling.tagName === "DT") {
          break;
        }
      }

      if (nestedDl) {
        parseDl(nestedDl, [...path, folderTitle]);
      }
    }
  }

  parseDl(rootDl, []);
  return items;
}

function extractImportItems(raw, fileName) {
  const trimmed = String(raw || "").trim();
  const loweredName = String(fileName || "").toLowerCase();

  if (trimmed.startsWith("{")) {
    return collectLegacyImportItems(trimmed);
  }

  if (trimmed.includes("NETSCAPE-Bookmark-file-1") || loweredName.endsWith(".html") || loweredName.endsWith(".htm")) {
    return collectNetscapeImportItems(trimmed);
  }

  return [];
}

function resolveImportParentFolderId() {
  if (state.selectedFolderId && state.folderById.has(state.selectedFolderId)) {
    return state.selectedFolderId;
  }

  if (state.preferredFolderId && state.folderById.has(state.preferredFolderId)) {
    return state.preferredFolderId;
  }

  return null;
}

function primeImportFolderCache() {
  const cache = new Map();
  for (const folder of state.folders) {
    const parentKey = folder.parentId || "root";
    const titleKey = normalizeForSearch(folder.title);
    cache.set(`${parentKey}::${titleKey}`, folder.id);
  }
  return cache;
}

async function ensureImportFolderPath(folderPath, startParentId, folderCache) {
  let currentParentId = startParentId;

  for (const segment of folderPath) {
    const title = String(segment || "").trim();
    if (!title) {
      continue;
    }

    const parentKey = currentParentId || "root";
    const cacheKey = `${parentKey}::${normalizeForSearch(title)}`;
    if (folderCache.has(cacheKey)) {
      currentParentId = folderCache.get(cacheKey);
      continue;
    }

    const createdFolder = await chrome.bookmarks.create(
      currentParentId ? { parentId: currentParentId, title } : { title }
    );

    currentParentId = createdFolder.id;
    folderCache.set(cacheKey, createdFolder.id);
  }

  return currentParentId;
}

async function importBookmarksData(file) {
  try {
    const raw = await file.text();
    const items = extractImportItems(raw, file.name);
    if (items.length === 0) {
      showToast(t("importInvalid"));
      return;
    }

    const confirmed = confirm(t("importConfirm", { count: items.length }));
    if (!confirmed) {
      return;
    }

    state.isImporting = true;
    state.importAbortRequested = false;
    syncActionButtons();

    let imported = 0;
    const importParentId = resolveImportParentFolderId();
    const folderCache = primeImportFolderCache();

    for (const item of items) {
      if (state.importAbortRequested) {
        break;
      }

      const title = String(item?.title || "").trim();
      const url = String(item?.url || "").trim();
      if (!title || !url) {
        continue;
      }

      try {
        new URL(url);
      } catch {
        continue;
      }

      const folderPath = Array.isArray(item.folderPath) ? item.folderPath : [];
      const parentId = await ensureImportFolderPath(folderPath, importParentId, folderCache);
      await chrome.bookmarks.create(parentId ? { title, url, parentId } : { title, url });
      imported += 1;

      if (imported % 50 === 0 || imported === items.length) {
        showToast(t("importProgress", { done: imported, total: items.length }));
      }
    }

    await loadBookmarks();
    render();

    if (state.importAbortRequested) {
      showToast(t("importCanceled"));
    } else {
      showToast(imported === 1 ? t("importDoneOne", { count: imported }) : t("importDoneMany", { count: imported }));
    }
  } catch {
    showToast(t("importInvalid"));
  } finally {
    state.isImporting = false;
    state.importAbortRequested = false;
    syncActionButtons();
  }
}


async function consumePendingQuickCapture() {

  const { pendingQuickCapture = null } = await chrome.storage.local.get("pendingQuickCapture");
  if (!pendingQuickCapture?.url || !pendingQuickCapture?.title) {
    return;
  }

  if (Date.now() - Number(pendingQuickCapture.ts || 0) > 60000) {
    await chrome.storage.local.remove("pendingQuickCapture");
    return;
  }

  state.isCreatePanelOpen = true;
  syncCreatePanel();
  els.newTitle.value = pendingQuickCapture.title;
  els.newUrl.value = pendingQuickCapture.url;
  els.newTitle.focus();

  await chrome.storage.local.remove("pendingQuickCapture");
}

function applyHealthFilter(items) {
  return items.filter((bookmark) => matchesHealthFilter(getBookmarkHealthStatus(bookmark), state.healthFilter));
}

function applyStaticTranslations() {
  document.documentElement.lang = state.locale;

  if (els.eyebrow) els.eyebrow.textContent = t("eyebrow");
  if (els.themeMenuPrefix) els.themeMenuPrefix.textContent = t("theme");

  if (els.languageSelect) {
    const labels = {
      auto: t("languageAuto"),
      en: t("languageEnglish"),
      pt: t("languagePortuguese"),
      es: t("languageSpanish")
    };
    for (const option of els.languageSelect.options) {
      if (labels[option.value]) {
        option.textContent = `${t("language")}: ${labels[option.value]}`;
      }
    }
    els.languageSelect.value = state.uiLanguage;
  }

  if (els.refreshBtn) {
    els.refreshBtn.textContent = t("refresh");
    els.refreshBtn.title = t("refreshTitle");
  }

  els.searchInput.placeholder = t("searchPlaceholder");
  els.sortSelect.title = t("sortTitle");
  els.domainFilter.title = t("filterBySite");
  els.recencyFilter.title = t("filterByRecency");
  if (els.healthFilter) {
    els.healthFilter.title = t("filterByHealth");
  }

  const sortLabels = {
    date_desc: t("sortDateNewest"),
    date_asc: t("sortDateOldest"),
    name_asc: t("sortNameAsc"),
    name_desc: t("sortNameDesc")
  };
  for (const option of els.sortSelect.options) {
    if (sortLabels[option.value]) {
      option.textContent = sortLabels[option.value];
    }
  }

  const recencyLabels = {
    all: t("anyTime"),
    7: t("last7"),
    30: t("last30"),
    90: t("last90"),
    365: t("last365")
  };
  for (const option of els.recencyFilter.options) {
    if (recencyLabels[option.value]) {
      option.textContent = recencyLabels[option.value];
    }
  }

  if (els.healthFilter) {
    const healthLabels = {
      all: t("allHealth"),
      needs_review: t("needsReview"),
      ok: t("healthOk"),
      redirect: t("healthRedirect"),
      broken: t("healthBroken"),
      stale: t("healthStale"),
      unknown: t("healthUnknown")
    };
    for (const option of els.healthFilter.options) {
      if (healthLabels[option.value]) {
        option.textContent = healthLabels[option.value];
      }
    }
  }

  if (els.densitySelect) {
    const densityLabels = {
      comfortable: t("densityComfortable"),
      compact: t("densityCompact")
    };
    for (const option of els.densitySelect.options) {
      if (densityLabels[option.value]) {
        option.textContent = densityLabels[option.value];
      }
    }
    els.densitySelect.value = state.density;
  }

  if (els.showDateMeta) {
    els.showDateMeta.checked = state.showDateMeta;
  }

  if (els.syncLabel) {
    els.syncLabel.textContent = t("sync");
  }

  if (els.syncEnabled) {
    els.syncEnabled.checked = state.syncEnabled;
  }

  if (els.uxHint) els.uxHint.innerHTML = t("shortcutsHtml");
  if (els.panelHint) els.panelHint.textContent = t("quickActions");
  if (els.bookmarkTabBtn) els.bookmarkTabBtn.textContent = t("addCurrentTab");
  if (els.newTitle) els.newTitle.placeholder = t("titlePlaceholder");
  if (els.createSubmitBtn) els.createSubmitBtn.textContent = t("addBookmark");
  if (els.foldersHeading) els.foldersHeading.textContent = t("folders");
  if (els.bookmarksHeading) els.bookmarksHeading.textContent = t("bookmarks");

  if (els.moveFolderSelect) {
    els.moveFolderSelect.title = t("moveSelectedTitle");
  }
  if (els.moveSelectedBtn) {
    els.moveSelectedBtn.textContent = t("moveSelected");
  }
  if (els.findDuplicatesBtn) {
    els.findDuplicatesBtn.textContent = t("findDuplicates");
  }
  if (els.showAllBtn) {
    els.showAllBtn.textContent = t("showAll");
  }
  if (els.deleteSelectedBtn) {
    els.deleteSelectedBtn.textContent = t("deleteSelected");
  }
  if (els.clearSelectionBtn) {
    els.clearSelectionBtn.textContent = t("clear");
  }
  syncActionButtons();
  if (els.exportBtn) {
    els.exportBtn.textContent = t("exportData");
  }
  if (els.showDateMetaLabel) {
    els.showDateMetaLabel.textContent = t("showDate");
  }
  if (els.commandPaletteTitle) {
    els.commandPaletteTitle.textContent = t("commandPalette");
  }
  if (els.commandPaletteInput) {
    els.commandPaletteInput.placeholder = t("commandPlaceholder");
  }
  if (els.onboardingEyebrow) {
    els.onboardingEyebrow.textContent = t("quickStart");
  }
  if (els.onboardingTitle) {
    els.onboardingTitle.textContent = t("onboardingTitle");
  }
  if (els.onboardingStep1) {
    els.onboardingStep1.textContent = t("onboardingStep1");
  }
  if (els.onboardingStep2) {
    els.onboardingStep2.textContent = t("onboardingStep2");
  }
  if (els.onboardingStep3) {
    els.onboardingStep3.textContent = t("onboardingStep3");
  }
  if (els.onboardingStart) {
    els.onboardingStart.textContent = t("onboardingStart");
  }
  if (els.onboardingImport) {
    els.onboardingImport.textContent = t("onboardingImport");
  }
  if (els.editTitleHeading) {
    els.editTitleHeading.textContent = t("editInlineTitle");
  }
  if (els.editCancelBtn) {
    els.editCancelBtn.textContent = t("editCancel");
  }
  if (els.editSaveBtn) {
    els.editSaveBtn.textContent = t("editSave");
  }
  if (els.editTitleInput) {
    els.editTitleInput.placeholder = t("titlePlaceholder");
  }

  syncDomainOptions();
  els.domainFilter.value = state.domainFilter;
  els.recencyFilter.value = state.recencyFilter;
  if (els.healthFilter) {
    els.healthFilter.value = state.healthFilter;
  }

  document.body.dataset.density = state.density;
  syncAdvancedFilters();
}

init().catch((error) => {
  console.error(error);
  showToast(t("failedLoad"));
});



async function init() {
  try {
    await loadSettings();
  } catch (_) {
  }

  try {
    await loadFavorites();
  } catch (_) {
  }

  state.locale = resolveLocale(state.uiLanguage);
  try {
    applyStaticTranslations();
  } catch (_) {
  }

  try {
    await loadBookmarks();
  } catch (_) {
  }

  try {
    wireEvents();
  } catch (_) {
  }

  try {
    render();
  } catch (_) {
  }

  try {
    syncOnboarding();
  } catch (_) {
  }

  try {
    await consumePendingQuickCapture();
  } catch (_) {
  }

  try {
    trackEvent("app_open", { bookmarkCount: state.allBookmarks.length });
  } catch (_) {
  }
}



function wireEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    if (state.query.length > 0) {
      state.scopedBookmarkIds = null;
      state.duplicateGroupById = new Map();
    }
    debounceBookmarkRender();
  });

  els.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      openSelectedBookmark();
    }
  });

  els.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderBookmarks();
  });

  if (els.toggleFiltersBtn) {
    els.toggleFiltersBtn.addEventListener("click", () => {
      state.filtersExpanded = !state.filtersExpanded;
      syncAdvancedFilters();
    });
  }

  els.domainFilter.addEventListener("change", (event) => {
    state.domainFilter = event.target.value || "all";
    state.scopedBookmarkIds = null;
    state.duplicateGroupById = new Map();
    renderBookmarks();
  });

  els.recencyFilter.addEventListener("change", (event) => {
    state.recencyFilter = event.target.value || "all";
    state.scopedBookmarkIds = null;
    state.duplicateGroupById = new Map();
    renderBookmarks();
  });

  if (els.healthFilter) {
    els.healthFilter.addEventListener("change", (event) => {
      state.healthFilter = event.target.value || "all";
      state.scopedBookmarkIds = null;
      state.duplicateGroupById = new Map();
      renderBookmarks();
    });
  }

  if (els.scanVisibleBtn) {
    els.scanVisibleBtn.addEventListener("click", async () => {
      await scanVisibleBookmarkLinks();
    });
  }

  if (els.densitySelect) {
    els.densitySelect.addEventListener("change", async (event) => {
      state.density = event.target.value === "compact" ? "compact" : "comfortable";
      document.body.dataset.density = state.density;
      await persistUserPreferences();
      renderBookmarks();
    });
  }

  if (els.showDateMeta) {
    els.showDateMeta.addEventListener("change", async (event) => {
      state.showDateMeta = Boolean(event.target.checked);
      await persistUserPreferences();
      renderBookmarks();
    });
  }

  if (els.syncEnabled) {
    els.syncEnabled.addEventListener("change", async (event) => {
      state.syncEnabled = Boolean(event.target.checked);
      await chrome.storage.local.set({ syncEnabled: state.syncEnabled });
      await persistUserPreferences();
      await persistFavorites();
      showToast(state.syncEnabled ? t("syncEnabledMsg") : t("syncDisabledMsg"));
    });
  }

  if (els.exportBtn) {
    els.exportBtn.addEventListener("click", () => {
      exportBookmarksData();
    });
  }

  if (els.importBtn) {
    els.importBtn.addEventListener("click", () => {
      if (state.isImporting) {
        state.importAbortRequested = true;
        showToast(t("importCanceled"));
        return;
      }
      els.importFileInput?.click();
    });
  }

  if (els.importFileInput) {
    els.importFileInput.addEventListener("change", async (event) => {
      const input = event.target;
      const file = input.files?.[0];
      if (!file) {
        return;
      }

      await importBookmarksData(file);
      input.value = "";
    });
  }

  els.languageSelect.addEventListener("change", async (event) => {
    const next = event.target.value;
    state.uiLanguage = next === "pt" || next === "en" || next === "es" ? next : "auto";
    state.locale = resolveLocale(state.uiLanguage);

    await persistUserPreferences();

    applyStaticTranslations();
    render();
  });

  els.themeMenuBtn.addEventListener("click", () => {
    setThemeMenuOpen(els.themeMenu.hidden);
  });

  els.themeMenu.addEventListener("click", async (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const option = event.target.closest(".theme-option");
    if (!option) {
      return;
    }

    await applyTheme(option.dataset.themeValue, true);
    setThemeMenuOpen(false);
  });

  document.addEventListener("click", (event) => {
    if (els.themeMenu.hidden || !(event.target instanceof Element)) {
      return;
    }

    if (!event.target.closest(".theme-menu-wrap")) {
      setThemeMenuOpen(false);
    }
  });

  if (els.commandPaletteClose) {
    els.commandPaletteClose.addEventListener("click", () => {
      setCommandPaletteOpen(false);
    });
  }

  if (els.commandPaletteOverlay) {
    els.commandPaletteOverlay.addEventListener("click", (event) => {
      if (event.target === els.commandPaletteOverlay) {
        setCommandPaletteOpen(false);
      }
    });
  }

  if (els.commandPaletteInput) {
    els.commandPaletteInput.addEventListener("input", (event) => {
      renderCommandPaletteActions(event.target.value || "");
    });

    els.commandPaletteInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setCommandPaletteOpen(false);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        movePaletteActive(1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        movePaletteActive(-1);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        runPaletteAction();
      }
    });
  }

  if (els.commandPaletteList) {
    els.commandPaletteList.addEventListener("mousemove", (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }
      const option = event.target.closest(".palette-option");
      if (!option) {
        return;
      }
      const index = Number(option.id.replace("palette-option-", ""));
      if (Number.isFinite(index) && index !== state.paletteActiveIndex) {
        state.paletteActiveIndex = index;
        renderCommandPaletteActions(els.commandPaletteInput?.value || "");
      }
    });

    els.commandPaletteList.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }
      const option = event.target.closest(".palette-option");
      const actionId = option?.dataset.action;
      if (actionId) {
        runPaletteAction(actionId);
      }
    });
  }

  if (els.onboardingStart) {
    els.onboardingStart.addEventListener("click", () => {
      void completeOnboarding();
    });
  }

  if (els.onboardingImport) {
    els.onboardingImport.addEventListener("click", () => {
      void completeOnboarding();
      els.importFileInput?.click();
    });
  }

  els.refreshBtn.addEventListener("click", async () => {
    await loadBookmarks();
    render();
    showToast(t("refreshed"));
  });

  els.toggleCreateBtn.addEventListener("click", () => {
    state.isCreatePanelOpen = !state.isCreatePanelOpen;
    syncCreatePanel();
  });

  els.bookmarkTabBtn.addEventListener("click", async () => {
    await bookmarkCurrentTab();
  });

  els.createForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = els.newTitle.value.trim();
    const url = els.newUrl.value.trim();
    const parentId = getCreateTargetFolderId(url);

    if (!title || !url) {
      showToast(t("titleUrlRequired"));
      return;
    }

    try {
      new URL(url);
    } catch {
      showToast(t("invalidUrl"));
      return;
    }

    const createDetails = parentId ? { title, url, parentId } : { title, url };
    const created = await chrome.bookmarks.create(createDetails);
    applyCreatedBookmark(created);
    trackEvent("first_bookmark_create", { source: "manual" });
    els.createForm.reset();
    render();
    showToast(t("created"));
  });

  if (els.editForm) {
    els.editForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await saveEditModal();
    });
  }

  if (els.editCancelBtn) {
    els.editCancelBtn.addEventListener("click", () => {
      closeEditModal({ restoreFocus: true });
    });
  }

  if (els.editOverlay) {
    els.editOverlay.addEventListener("click", (event) => {
      if (event.target === els.editOverlay) {
        closeEditModal({ restoreFocus: true });
      }
    });
  }

  els.folderList.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const toggle = event.target.closest(".folder-toggle");
    if (toggle) {
      const folderId = toggle.dataset.folderId;
      if (!folderId) {
        return;
      }
      if (state.collapsedFolders.has(folderId)) {
        state.collapsedFolders.delete(folderId);
      } else {
        state.collapsedFolders.add(folderId);
      }
      persistCollapsedFolders();
      renderFolders();
      return;
    }

    const button = event.target.closest(".folder-btn");
    if (!button) {
      return;
    }

    state.selectedFolderId = button.dataset.id === "all" ? null : button.dataset.id;
    state.scopedBookmarkIds = null;
    state.duplicateGroupById = new Map();
    trackEvent("first_folder_select", { folderId: state.selectedFolderId || "all" });
    render();
  });

  els.folderList.addEventListener("dragover", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const button = event.target.closest(".folder-btn");
    if (!button) {
      return;
    }

    event.preventDefault();
    button.classList.add("drop-target");
  });

  els.folderList.addEventListener("dragleave", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const button = event.target.closest(".folder-btn");
    if (!button) {
      return;
    }
    button.classList.remove("drop-target");
  });

  els.folderList.addEventListener("drop", async (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const button = event.target.closest(".folder-btn");
    if (!button) {
      return;
    }

    event.preventDefault();
    button.classList.remove("drop-target");

    const folderId = button.dataset.id === "all" ? state.preferredFolderId : button.dataset.id;
    if (!folderId) {
      return;
    }

    const payload = event.dataTransfer?.getData("application/x-bookmark-ids");
    if (!payload) {
      return;
    }

    const ids = payload.split(",").map((id) => id.trim()).filter(Boolean);
    await moveBookmarksToFolder(ids, folderId);
  });

  els.findDuplicatesBtn.addEventListener("click", () => {
    selectDuplicateBookmarks();
  });

  els.showAllBtn.addEventListener("click", () => {
    state.scopedBookmarkIds = null;
    state.duplicateGroupById = new Map();
    render();
  });

  els.moveSelectedBtn.addEventListener("click", async () => {
    const ids = [...state.selectedBookmarkIds];
    if (ids.length === 0) {
      return;
    }

    const targetFolderId = els.moveFolderSelect.value;
    if (!targetFolderId) {
      showToast(t("chooseFolder"));
      return;
    }

    await moveBookmarksToFolder(ids, targetFolderId);
  });

  els.deleteSelectedBtn.addEventListener("click", async () => {
    await deleteSelectedBookmarks();
  });

  els.clearSelectionBtn.addEventListener("click", () => {
    state.selectedBookmarkIds.clear();
    syncBulkActions();
    updateSelectedBookmarkStyles();
  });

  els.bookmarkList.addEventListener("scroll", () => {
    if (state.isVirtualized) {
      renderVirtualSliceFromScroll(false);
    }
  });

  els.bookmarkList.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLInputElement) || !event.target.classList.contains("select-checkbox")) {
      return;
    }

    const listItem = event.target.closest(".bookmark-item");
    if (!listItem) {
      return;
    }

    const bookmarkId = listItem.dataset.id;
    if (!bookmarkId) {
      return;
    }

    if (event.target.checked) {
      state.selectedBookmarkIds.add(bookmarkId);
    } else {
      state.selectedBookmarkIds.delete(bookmarkId);
    }

    syncBulkActions();
    updateSelectedBookmarkStyles();
  });

  els.bookmarkList.addEventListener("dragstart", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const listItem = event.target.closest(".bookmark-item");
    if (!listItem) {
      return;
    }

    const id = listItem.dataset.id;
    if (!id || !event.dataTransfer) {
      return;
    }

    const ids = state.selectedBookmarkIds.has(id)
      ? [...state.selectedBookmarkIds]
      : [id];

    event.dataTransfer.setData("application/x-bookmark-ids", ids.join(","));
    event.dataTransfer.effectAllowed = "move";
  });

  els.bookmarkList.addEventListener("click", async (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const actionButton = event.target.closest("[data-empty-action]");
    if (actionButton) {
      await handleEmptyAction(actionButton.dataset.emptyAction);
      return;
    }

    if (event.target.closest(".select-checkbox")) {
      return;
    }

    const target = event.target;
    const listItem = target.closest(".bookmark-item");
    if (!listItem) {
      return;
    }

    setSelectedBookmarkId(listItem.dataset.id, { scroll: false });
    const bookmark = getSelectedBookmark();
    if (!bookmark) {
      return;
    }

    if (target.classList.contains("favorite-btn")) {
      await toggleFavorite(bookmark.id);
      renderBookmarks();
      return;
    }

    if (target.classList.contains("delete-btn")) {
      await deleteBookmark(bookmark);
      return;
    }

    if (target.classList.contains("edit-btn")) {
      await editBookmark(bookmark);
      return;
    }

    if (target.classList.contains("bookmark-link")) {
      trackEvent("bookmark_open", { id: bookmark.id, source: "mouse" });
    }
  });

  document.addEventListener("keydown", handleGlobalShortcuts);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (changes.pendingQuickCapture) {
      void consumePendingQuickCapture();
    }
  });
}

function handleGlobalShortcuts(event) {
  const target = event.target;
  const isTyping = target instanceof HTMLElement && (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );

  if ((event.metaKey || event.ctrlKey) && (event.key === "k" || event.key === "K")) {
    event.preventDefault();
    setCommandPaletteOpen(!state.commandPaletteOpen);
    return;
  }

  if (event.key === "Escape" && state.commandPaletteOpen) {
    event.preventDefault();
    setCommandPaletteOpen(false);
    return;
  }

  if (state.commandPaletteOpen) {
    return;
  }

  if (event.key === "Escape" && els.editOverlay && !els.editOverlay.hidden) {
    event.preventDefault();
    closeEditModal({ restoreFocus: true });
    return;
  }

  if (event.key === "Escape" && !state.onboardingCompleted) {
    event.preventDefault();
    void completeOnboarding();
    return;
  }

  if (event.key === "?" && !isTyping && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    showToast(t("shortcutsQuickHelp"));
    return;
  }

  if (event.key === "/" && !isTyping) {
    event.preventDefault();
    els.searchInput.focus();
    els.searchInput.select();
    return;
  }

  if ((event.key === "n" || event.key === "N") && !isTyping && !event.metaKey && !event.ctrlKey) {
    event.preventDefault();
    state.isCreatePanelOpen = !state.isCreatePanelOpen;
    syncCreatePanel();
    if (state.isCreatePanelOpen) {
      els.newTitle.focus();
    }
    return;
  }

  if (event.key === "Escape" && !els.themeMenu.hidden) {
    setThemeMenuOpen(false);
    return;
  }

  if (event.key === "Escape" && state.isCreatePanelOpen) {
    state.isCreatePanelOpen = false;
    syncCreatePanel();
    els.searchInput.focus();
    return;
  }

  if ((event.metaKey || event.ctrlKey) && !isTyping && (event.key === "a" || event.key === "A")) {
    event.preventDefault();
    toggleSelectAllVisible();
    return;
  }

  if (isTyping || event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    navigateSelection(1);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    navigateSelection(-1);
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    openSelectedBookmark();
    return;
  }

  if (event.key === "e" || event.key === "E") {
    event.preventDefault();
    const bookmark = getSelectedBookmark();
    if (bookmark) {
      void editBookmark(bookmark);
    }
    return;
  }

  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    const bookmark = getSelectedBookmark();
    if (bookmark) {
      void deleteBookmark(bookmark);
    }
  }
}

function navigateSelection(delta) {
  if (state.filteredBookmarks.length === 0) {
    return;
  }

  const currentIndex = state.filteredBookmarks.findIndex((bookmark) => bookmark.id === state.selectedBookmarkId);
  const baseIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndex = Math.min(state.filteredBookmarks.length - 1, Math.max(0, baseIndex + delta));

  setSelectedBookmarkId(state.filteredBookmarks[nextIndex].id, { scroll: true });
}

function setSelectedBookmarkId(bookmarkId, { scroll = true } = {}) {
  state.selectedBookmarkId = bookmarkId;
  updateSelectedBookmarkStyles();
  if (scroll) {
    scrollSelectedBookmarkIntoView();
  }
}

function updateSelectedBookmarkStyles() {
  const nodes = els.bookmarkList.querySelectorAll(".bookmark-item");
  for (const node of nodes) {
    const bookmarkId = node.dataset.id || "";
    const selected = bookmarkId === state.selectedBookmarkId;
    const bulkSelected = state.selectedBookmarkIds.has(bookmarkId);

    node.classList.toggle("is-selected", selected);
    node.classList.toggle("is-bulk-selected", bulkSelected);
    node.setAttribute("aria-selected", selected ? "true" : "false");

    const checkbox = node.querySelector(".select-checkbox");
    if (checkbox) {
      checkbox.checked = bulkSelected;
    }
  }
}

function scrollSelectedBookmarkIntoView() {
  if (!state.selectedBookmarkId) {
    return;
  }

  if (state.isVirtualized) {
    const index = state.filteredBookmarks.findIndex((bookmark) => bookmark.id === state.selectedBookmarkId);
    if (index === -1) {
      return;
    }

    const itemTop = index * VIRTUAL_ROW_HEIGHT;
    const itemBottom = itemTop + VIRTUAL_ROW_HEIGHT;
    const viewTop = els.bookmarkList.scrollTop;
    const viewBottom = viewTop + els.bookmarkList.clientHeight;

    if (itemTop < viewTop) {
      els.bookmarkList.scrollTop = itemTop;
      renderVirtualSliceFromScroll(false);
    } else if (itemBottom > viewBottom) {
      els.bookmarkList.scrollTop = itemBottom - els.bookmarkList.clientHeight;
      renderVirtualSliceFromScroll(false);
    }
    return;
  }

  const selectedNode = els.bookmarkList.querySelector(`.bookmark-item[data-id="${cssEscape(state.selectedBookmarkId)}"]`);
  selectedNode?.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function cssEscape(value) {
  return value.replace(/"/g, "\\\"");
}

function getSelectedBookmark() {
  if (!state.selectedBookmarkId) {
    return null;
  }

  return state.filteredBookmarks.find((bookmark) => bookmark.id === state.selectedBookmarkId)
    || state.allBookmarks.find((bookmark) => bookmark.id === state.selectedBookmarkId)
    || null;
}

function closeEditModal({ restoreFocus = true } = {}) {
  if (els.editOverlay) {
    els.editOverlay.hidden = true;
  }

  state.editingBookmarkId = null;

  if (restoreFocus) {
    if (state.lastFocusedElement instanceof HTMLElement) {
      state.lastFocusedElement.focus();
    } else {
      els.searchInput.focus();
    }
  }
}

function openEditModal(bookmark) {
  if (!bookmark || !els.editOverlay || !els.editTitleInput || !els.editUrlInput) {
    return;
  }

  state.lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  state.editingBookmarkId = bookmark.id;

  els.editTitleInput.value = bookmark.title || "";
  els.editUrlInput.value = bookmark.url || "";
  els.editOverlay.hidden = false;
  els.editTitleInput.focus();
  els.editTitleInput.select();
}

async function saveEditModal() {
  const bookmarkId = state.editingBookmarkId;
  if (!bookmarkId) {
    return;
  }

  const bookmark = state.allBookmarks.find((entry) => entry.id === bookmarkId);
  if (!bookmark) {
    closeEditModal({ restoreFocus: true });
    return;
  }

  const nextTitle = String(els.editTitleInput?.value || "").trim();
  const nextUrl = String(els.editUrlInput?.value || "").trim();

  if (!nextTitle || !nextUrl) {
    showToast(t("titleUrlRequired"));
    return;
  }

  try {
    new URL(nextUrl);
  } catch {
    showToast(t("invalidUrl"));
    return;
  }

  await chrome.bookmarks.update(bookmark.id, { title: nextTitle, url: nextUrl });
  applyEditedBookmark(bookmark.id, nextTitle, nextUrl);
  await persistLinkHealth();
  render();
  setSelectedBookmarkId(bookmark.id, { scroll: true });
  closeEditModal({ restoreFocus: true });
  showToast(t("updated"));
}

async function editBookmark(bookmark) {
  openEditModal(bookmark);
}


async function restoreDeletedBookmarks(snapshots) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return;
  }

  let restored = 0;
  for (const snapshot of snapshots) {
    const title = String(snapshot?.title || "").trim();
    const url = String(snapshot?.url || "").trim();
    const parentId = snapshot?.parentId || null;

    if (!title || !url) {
      continue;
    }

    try {
      new URL(url);
    } catch {
      continue;
    }

    await chrome.bookmarks.create(parentId ? { title, url, parentId } : { title, url });
    restored += 1;
  }

  await loadBookmarks();
  render();
  if (restored > 0) {
    showToast(formatRestoredCount(restored));
  }
}

async function undoBookmarkMove(moves) {
  for (const move of moves) {
    if (!move?.id || !move.fromParentId) {
      continue;
    }
    try {
      await chrome.bookmarks.move(move.id, { parentId: move.fromParentId });
    } catch {
      // Ignore missing bookmarks after move.
    }
  }

  await loadBookmarks();
  render();
}

async function deleteBookmark(bookmark) {
  const confirmed = confirm(t("deleteConfirm", { title: bookmark.title }));
  if (!confirmed) {
    return;
  }

  const snapshot = {
    title: bookmark.title,
    url: bookmark.url,
    parentId: bookmark.parentId
  };

  await chrome.bookmarks.remove(bookmark.id);
  applyDeletedBookmark(bookmark);
  await persistLinkHealth();
  render();
  showToast(t("removed"), {
    actionLabel: t("undo"),
    onAction: () => restoreDeletedBookmarks([snapshot]),
    durationMs: 5000
  });
  trackEvent("bookmark_deleted", { id: bookmark.id });
}

function openSelectedBookmark() {
  const bookmark = getSelectedBookmark() || state.filteredBookmarks[0];
  if (!bookmark?.url) {
    return;
  }

  chrome.tabs.create({ url: bookmark.url });
  trackEvent("bookmark_open", { id: bookmark.id, source: "keyboard" });
}

async function handleEmptyAction(action) {
  if (action === "open_create") {
    state.isCreatePanelOpen = true;
    syncCreatePanel();
    els.newTitle.focus();
    return;
  }

  if (action === "add_current_tab") {
    await bookmarkCurrentTab();
    return;
  }

  if (action === "clear_filters") {
    state.query = "";
    state.selectedFolderId = null;
    state.scopedBookmarkIds = null;
    state.duplicateGroupById = new Map();
    state.domainFilter = "all";
    state.recencyFilter = "all";
    state.healthFilter = "all";
    els.searchInput.value = "";
    els.domainFilter.value = "all";
    els.recencyFilter.value = "all";
    if (els.healthFilter) {
      els.healthFilter.value = "all";
    }
    render();
  }
}

function debounceBookmarkRender() {
  clearTimeout(state.searchTimer);
  state.searchTimer = setTimeout(() => {
    const startedAt = performance.now();
    const resultCount = renderBookmarks();
    const durationMs = Math.round(performance.now() - startedAt);

    state.searchDurations.push(durationMs);
    if (state.searchDurations.length > 100) {
      state.searchDurations.shift();
    }

    const p95DurationMs = percentile95(state.searchDurations);

    if (state.query.length > 0 && !state.hasTrackedFirstSearch) {
      state.hasTrackedFirstSearch = true;
      trackEvent("first_search", { queryLength: state.query.length });
    }

    trackEvent("search_executed", {
      queryLength: state.query.length,
      resultCount,
      durationMs,
      p95DurationMs
    });
  }, SEARCH_DEBOUNCE_MS);
}

function percentile95(values) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[index];
}

function syncCreatePanel() {
  els.createPanel.hidden = !state.isCreatePanelOpen;
  els.toggleCreateBtn.textContent = state.isCreatePanelOpen ? t("close") : t("newBookmark");
}

function syncAdvancedFilters() {
  if (!els.advancedFilters || !els.toggleFiltersBtn) {
    return;
  }

  els.advancedFilters.hidden = !state.filtersExpanded;
  els.toggleFiltersBtn.setAttribute("aria-expanded", String(state.filtersExpanded));
  els.toggleFiltersBtn.textContent = state.filtersExpanded ? t("lessFilters") : t("moreFilters");
}

function setThemeMenuOpen(isOpen) {
  els.themeMenu.hidden = !isOpen;
  els.themeMenuBtn.setAttribute("aria-expanded", String(isOpen));
}
function setCommandPaletteOpen(isOpen) {
  if (isOpen) {
    state.lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  state.commandPaletteOpen = isOpen;
  if (els.commandPaletteOverlay) {
    els.commandPaletteOverlay.hidden = !isOpen;
  }

  if (isOpen) {
    renderCommandPaletteActions("");
    if (els.commandPaletteInput) {
      els.commandPaletteInput.value = "";
      els.commandPaletteInput.focus();
    }
  } else if (state.lastFocusedElement instanceof HTMLElement) {
    state.lastFocusedElement.focus();
  }
}

function getCommandPaletteActions() {
  return [
    {
      id: "focus_search",
      label: t("commandSearch"),
      run: () => {
        els.searchInput.focus();
        els.searchInput.select();
      }
    },
    {
      id: "new_bookmark",
      label: t("commandNewBookmark"),
      run: () => {
        state.isCreatePanelOpen = true;
        syncCreatePanel();
        els.newTitle.focus();
      }
    },
    {
      id: "find_duplicates",
      label: t("commandFindDuplicates"),
      run: () => {
        selectDuplicateBookmarks();
      }
    },
    {
      id: "show_all",
      label: t("commandShowAll"),
      run: () => {
        state.scopedBookmarkIds = null;
        state.duplicateGroupById = new Map();
        render();
      }
    },
    {
      id: "clear_filters",
      label: t("commandClearFilters"),
      run: () => {
        void handleEmptyAction("clear_filters");
      }
    },
    {
      id: "refresh",
      label: t("commandRefresh"),
      run: () => {
        void loadBookmarks().then(() => {
          render();
          showToast(t("refreshed"));
        });
      }
    }
  ];
}

function renderCommandPaletteActions(query) {
  if (!els.commandPaletteList) {
    return;
  }

  const normalized = normalizeForSearch(query || "");
  state.paletteActions = getCommandPaletteActions()
    .filter((entry) => normalizeForSearch(entry.label).includes(normalized));

  if (state.paletteActions.length === 0) {
    state.paletteActiveIndex = 0;
  } else {
    state.paletteActiveIndex = Math.min(state.paletteActions.length - 1, Math.max(0, state.paletteActiveIndex));
  }

  els.commandPaletteList.innerHTML = "";

  if (state.paletteActions.length === 0) {
    const empty = document.createElement("li");
    empty.className = "palette-empty";
    empty.textContent = t("commandNoResults");
    els.commandPaletteList.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (let index = 0; index < state.paletteActions.length; index += 1) {
    const action = state.paletteActions[index];
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "palette-option";
    button.dataset.action = action.id;
    button.id = `palette-option-${index}`;
    button.setAttribute("role", "option");
    const isActive = index === state.paletteActiveIndex;
    button.setAttribute("aria-selected", isActive ? "true" : "false");
    button.textContent = action.label;
    item.append(button);
    fragment.append(item);
  }

  els.commandPaletteList.setAttribute("aria-activedescendant", `palette-option-${state.paletteActiveIndex}`);
  els.commandPaletteList.append(fragment);
}

function movePaletteActive(delta) {
  if (!state.commandPaletteOpen || state.paletteActions.length === 0) {
    return;
  }

  const total = state.paletteActions.length;
  state.paletteActiveIndex = (state.paletteActiveIndex + delta + total) % total;
  renderCommandPaletteActions(els.commandPaletteInput?.value || "");

  const active = els.commandPaletteList?.querySelector('[aria-selected="true"]');
  active?.scrollIntoView({ block: "nearest" });
}

function runPaletteAction(actionId = null) {
  const resolvedId = actionId || state.paletteActions[state.paletteActiveIndex]?.id || null;
  if (!resolvedId) {
    return;
  }

  const action = getCommandPaletteActions().find((entry) => entry.id === resolvedId);
  if (!action) {
    return;
  }

  setCommandPaletteOpen(false);
  action.run();
}


function syncOnboarding() {
  if (!els.onboardingOverlay) {
    return;
  }
  els.onboardingOverlay.hidden = state.onboardingCompleted;
}

async function completeOnboarding() {
  state.onboardingCompleted = true;
  syncOnboarding();
  await chrome.storage.local.set({ onboardingCompleted: true });
}


async function loadBookmarks() {
  const startedAt = performance.now();

  let tree = [];
  try {
    tree = await chrome.bookmarks.getTree();
  } catch (error) {
    console.error("bookmarks_getTree_promise_error", error);
    tree = await new Promise((resolve) => {
      chrome.bookmarks.getTree((result) => {
        if (chrome.runtime.lastError) {
          console.error("bookmarks_getTree_callback_error", chrome.runtime.lastError);
          resolve([]);
          return;
        }
        resolve(result || []);
      });
    });
  }

  if (!Array.isArray(tree) || !tree[0]) {
    state.folders = [];
    state.allBookmarks = [];
    rebuildFolderMaps();
    syncMoveFolderOptions();
    syncDomainOptions();
    state.selectedFolderId = null;
    return;
  }

  const parsed = parseBookmarkTree(tree[0]);

  state.folders = parsed.folders;
  state.allBookmarks = parsed.bookmarks;

  rebuildFolderMaps();
  sanitizeCollapsedFolders();
  syncMoveFolderOptions();
  syncDomainOptions();

  if (!state.preferredFolderId || !state.folderById.has(state.preferredFolderId)) {
    state.preferredFolderId = state.folders.find((folder) => folder.title.toLowerCase().includes("bookmark"))?.id
      || state.folders[0]?.id
      || null;
  }

  if (state.selectedFolderId && !state.folderById.has(state.selectedFolderId)) {
    state.selectedFolderId = null;
  }

  trackEvent("bookmarks_loaded", {
    count: state.allBookmarks.length,
    durationMs: Math.round(performance.now() - startedAt)
  });
}


function rebuildFolderMaps() {
  state.folderById = new Map();
  state.folderChildrenCount = new Map();

  for (const folder of state.folders) {
    state.folderById.set(folder.id, folder);
    if (!state.folderChildrenCount.has(folder.id)) {
      state.folderChildrenCount.set(folder.id, 0);
    }
  }

  for (const folder of state.folders) {
    if (folder.parentId) {
      const next = (state.folderChildrenCount.get(folder.parentId) || 0) + 1;
      state.folderChildrenCount.set(folder.parentId, next);
    }
  }
}

function syncDomainOptions() {
  const counts = new Map();
  for (const bookmark of state.allBookmarks) {
    const key = normalizeForSearch(bookmark.domain);
    if (!key || key === "unknown site") {
      continue;
    }
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  state.domainOptions = [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, 300);

  const previous = state.domainFilter;
  els.domainFilter.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = t("allSites");
  els.domainFilter.append(allOption);

  for (const optionData of state.domainOptions) {
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = `${optionData.value} (${optionData.count})`;
    els.domainFilter.append(option);
  }

  const hasPrevious = previous === "all" || state.domainOptions.some((entry) => entry.value === previous);
  state.domainFilter = hasPrevious ? previous : "all";
  els.domainFilter.value = state.domainFilter;
}

function syncMoveFolderOptions() {
  const current = els.moveFolderSelect.value;
  els.moveFolderSelect.innerHTML = "";

  for (const folder of state.folders) {
    const option = document.createElement("option");
    option.value = folder.id;
    option.textContent = folder.path;
    els.moveFolderSelect.append(option);
  }

  if (current && state.folderById.has(current)) {
    els.moveFolderSelect.value = current;
  } else if (state.selectedFolderId && state.folderById.has(state.selectedFolderId)) {
    els.moveFolderSelect.value = state.selectedFolderId;
  } else if (state.preferredFolderId && state.folderById.has(state.preferredFolderId)) {
    els.moveFolderSelect.value = state.preferredFolderId;
  }
}

function parseBookmarkTree(root) {
  const folders = [];
  const bookmarks = [];

  function walk(node, trail, idTrail, depth) {
    if (node.url) {
      const title = node.title || "(untitled)";
      const parentPath = trail.join(" / ");
      const parentId = idTrail[idTrail.length - 1] || null;

      bookmarks.push({
        id: node.id,
        title,
        url: node.url,
        domain: safeDomain(node.url),
        parentPath,
        parentId,
        folderTrailIds: [...idTrail],
        dateAdded: node.dateAdded || 0,
        searchText: buildSearchText(title, node.url, parentPath),
        searchNormalized: normalizeForSearch(buildSearchText(title, node.url, parentPath))
      });
      return 1;
    }

    const nextTrail = node.id === "0" ? trail : [...trail, node.title || "(untitled folder)"];
    const nextIdTrail = node.id === "0" ? idTrail : [...idTrail, node.id];

    let totalBookmarks = 0;
    if (node.children) {
      for (const child of node.children) {
        totalBookmarks += walk(child, nextTrail, nextIdTrail, depth + 1);
      }
    }

    if (node.id !== "0") {
      folders.push({
        id: node.id,
        title: node.title || "(untitled folder)",
        path: nextTrail.join(" / "),
        parentPath: trail.join(" / "),
        parentId: idTrail[idTrail.length - 1] || null,
        ancestorIds: [...idTrail],
        depth,
        totalBookmarks
      });
    }

    return totalBookmarks;
  }

  walk(root, [], [], -1);
  folders.sort((a, b) => a.path.localeCompare(b.path));
  return { folders, bookmarks };
}

function render() {
  renderFolders();
  renderBookmarks();
  updateSelectedFolderLabel();
  syncCreatePanel();
  syncBulkActions();
  syncScopedModeControls();
}

function renderFolders() {
  const fragment = document.createDocumentFragment();
  els.folderList.innerHTML = "";

  const allItem = document.createElement("li");
  allItem.className = "folder-item";

  const allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.className = "folder-btn";
  allBtn.dataset.id = "all";
  if (!state.selectedFolderId) {
    allBtn.classList.add("active");
  }

  const allHead = document.createElement("div");
  allHead.className = "folder-head";

  const allHeadLeft = document.createElement("div");
  allHeadLeft.className = "folder-head-left";

  const allTitle = document.createElement("span");
  allTitle.className = "folder-title";
  allTitle.textContent = t("allBookmarks");

  const allCount = document.createElement("span");
  allCount.className = "folder-count";
  allCount.textContent = String(state.allBookmarks.length);

  allHeadLeft.append(allTitle);
  allHead.append(allHeadLeft, allCount);
  allBtn.append(allHead);
  allItem.append(allBtn);
  fragment.append(allItem);

  const visibleFolders = state.folders.filter((folder) => {
    for (const ancestorId of folder.ancestorIds) {
      if (state.collapsedFolders.has(ancestorId)) {
        return false;
      }
    }
    return true;
  });

  for (const folder of visibleFolders) {
    const item = document.createElement("li");
    item.className = "folder-item";
    item.style.setProperty("--depth", String(folder.depth));
    if (folder.depth > 0) {
      item.classList.add("subtree");
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "folder-btn";
    if (folder.depth > 0) {
      button.classList.add("subfolder");
    }
    button.dataset.id = folder.id;

    const treeX = 10 + folder.depth * 14;
    button.style.setProperty("--tree-x", treeX + "px");
    button.style.paddingLeft = 12 + folder.depth * 14 + "px";

    if (state.selectedFolderId === folder.id) {
      button.classList.add("active");
    }

    const head = document.createElement("div");
    head.className = "folder-head";

    const headLeft = document.createElement("div");
    headLeft.className = "folder-head-left";

    const childCount = state.folderChildrenCount.get(folder.id) || 0;
    if (childCount > 0) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "folder-toggle";
      toggle.dataset.folderId = folder.id;
      toggle.textContent = state.collapsedFolders.has(folder.id) ? "▸" : "▾";
      headLeft.append(toggle);
    }

    const title = document.createElement("span");
    title.className = "folder-title";
    title.textContent = folder.title;

    const count = document.createElement("span");
    count.className = "folder-count";
    count.textContent = String(folder.totalBookmarks);

    headLeft.append(title);
    head.append(headLeft, count);
    button.append(head);

    if (folder.depth > 0 && folder.parentPath) {
      const parentLabel = folder.parentPath.split(" / ").slice(-1)[0];
      const parent = document.createElement("span");
      parent.className = "folder-parent";
      parent.textContent = parentLabel;
      button.append(parent);
    }

    item.append(button);
    fragment.append(item);
  }

  els.folderList.append(fragment);
}

function renderBookmarks() {
  let items = getFilteredBookmarks();
  items = applyHealthFilter(items);

  if (state.scopedBookmarkIds && state.scopedBookmarkIds.size > 0) {
    items = items.filter((bookmark) => state.scopedBookmarkIds.has(bookmark.id));
  }

  if (state.duplicateGroupById.size > 0) {
    items.sort((a, b) => {
      const metaA = state.duplicateGroupById.get(a.id);
      const metaB = state.duplicateGroupById.get(b.id);
      if (!metaA || !metaB) {
        return 0;
      }
      if (metaA.groupIndex !== metaB.groupIndex) {
        return metaA.groupIndex - metaB.groupIndex;
      }
      return Number(b.dateAdded || 0) - Number(a.dateAdded || 0);
    });
  }

  state.filteredBookmarks = items;

  if (!items.some((bookmark) => bookmark.id === state.selectedBookmarkId)) {
    state.selectedBookmarkId = items[0]?.id || null;
  }

  pruneSelectionToVisible(items);

  els.countLabel.textContent = formatItemCount(items.length);
  els.bookmarkList.innerHTML = "";

  if (items.length === 0) {
    renderEmptyState();
    state.isVirtualized = false;
    syncBulkActions();
    return 0;
  }

  state.isVirtualized = items.length > VIRTUALIZE_THRESHOLD;
  if (state.isVirtualized) {
    renderVirtualSliceFromScroll(true);
  } else {
    renderFullList(items);
  }

  syncBulkActions();
  return items.length;
}

function renderFullList(items) {
  const fragment = document.createDocumentFragment();
  for (const bookmark of items) {
    fragment.append(createBookmarkNode(bookmark));
  }
  els.bookmarkList.append(fragment);
  updateSelectedBookmarkStyles();
}

function renderVirtualSliceFromScroll(resetScroll) {
  if (!state.isVirtualized) {
    return;
  }

  if (resetScroll) {
    els.bookmarkList.scrollTop = 0;
  }

  const total = state.filteredBookmarks.length;
  const viewportHeight = els.bookmarkList.clientHeight || 520;
  const scrollTop = els.bookmarkList.scrollTop;

  const start = Math.max(0, Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN);
  const visibleCount = Math.ceil(viewportHeight / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN * 2;
  const end = Math.min(total, start + visibleCount);

  if (!resetScroll && state.virtualRange.start === start && state.virtualRange.end === end) {
    return;
  }

  state.virtualRange = { start, end };

  const topSpacer = document.createElement("li");
  topSpacer.className = "virtual-spacer";
  topSpacer.style.height = `${start * VIRTUAL_ROW_HEIGHT}px`;

  const bottomSpacer = document.createElement("li");
  bottomSpacer.className = "virtual-spacer";
  bottomSpacer.style.height = `${(total - end) * VIRTUAL_ROW_HEIGHT}px`;

  const fragment = document.createDocumentFragment();
  fragment.append(topSpacer);

  for (let index = start; index < end; index += 1) {
    fragment.append(createBookmarkNode(state.filteredBookmarks[index]));
  }

  fragment.append(bottomSpacer);

  els.bookmarkList.innerHTML = "";
  els.bookmarkList.append(fragment);
  updateSelectedBookmarkStyles();
}

function createBookmarkNode(bookmark) {
  const node = els.itemTemplate.content.firstElementChild.cloneNode(true);
  node.dataset.id = bookmark.id;
  node.classList.toggle("is-selected", bookmark.id === state.selectedBookmarkId);
  node.classList.toggle("is-bulk-selected", state.selectedBookmarkIds.has(bookmark.id));
  node.setAttribute("aria-selected", bookmark.id === state.selectedBookmarkId ? "true" : "false");

  const checkbox = node.querySelector(".select-checkbox");
  checkbox.checked = state.selectedBookmarkIds.has(bookmark.id);
  checkbox.title = t("selectForBatch");

  const favoriteBtn = node.querySelector(".favorite-btn");
  favoriteBtn.title = t("toggleFavorite");
  favoriteBtn.textContent = state.favorites.has(bookmark.id) ? "★" : "☆";
  favoriteBtn.classList.toggle("active", state.favorites.has(bookmark.id));

  const link = node.querySelector(".bookmark-link");
  link.textContent = bookmark.title;
  link.href = bookmark.url;

  const editBtn = node.querySelector(".edit-btn");
  editBtn.title = t("editBookmark");
  editBtn.setAttribute("aria-label", t("editBookmark"));

  const deleteBtn = node.querySelector(".delete-btn");
  deleteBtn.title = t("deleteBookmark");
  deleteBtn.setAttribute("aria-label", t("deleteBookmark"));

  const folderName = bookmark.parentPath
    ? bookmark.parentPath.split(" / ").slice(-1)[0]
    : t("allFolders");

  const metaParts = [bookmark.domain, folderName];
  const duplicateMeta = state.duplicateGroupById.get(bookmark.id);
  if (duplicateMeta) {
    metaParts.push(t("duplicateGroup", { index: duplicateMeta.groupIndex, count: duplicateMeta.totalInGroup }));
  }
  if (state.showDateMeta && Number(bookmark.dateAdded || 0) > 0) {
    metaParts.push(new Date(Number(bookmark.dateAdded)).toLocaleDateString());
  }

  const meta = node.querySelector(".bookmark-meta");
  meta.textContent = metaParts.join(" • ");

  const healthStatus = getBookmarkHealthStatus(bookmark);
  const badge = document.createElement("span");
  badge.className = `health-badge ${healthStatus}`;

  const healthLabelMap = {
    ok: t("healthOk"),
    redirect: t("healthRedirect"),
    broken: t("healthBroken"),
    stale: t("healthStale"),
    unknown: t("healthUnknown")
  };
  badge.textContent = healthLabelMap[healthStatus] || t("healthUnknown");
  meta.append(badge);
  return node;
}

function renderEmptyState() {
  const empty = document.createElement("li");
  empty.className = "empty-state card";

  if (state.allBookmarks.length === 0) {
    empty.innerHTML = `
      <p class="empty-title">${t("noBookmarksTitle")}</p>
      <p class="empty-subtitle">${t("noBookmarksSubtitle")}</p>
      <div class="empty-actions">
        <button class="btn" type="button" data-empty-action="add_current_tab">${t("addCurrentTab")}</button>
        <button class="btn ghost" type="button" data-empty-action="open_create">${t("createBookmark")}</button>
      </div>
    `;
  } else {
    empty.innerHTML = `
      <p class="empty-title">${t("noResultsTitle")}</p>
      <p class="empty-subtitle">${t("noResultsSubtitle")}</p>
      <div class="empty-actions">
        <button class="btn ghost" type="button" data-empty-action="clear_filters">${t("clearFilters")}</button>
      </div>
    `;
  }

  els.bookmarkList.append(empty);
}

function pruneSelectionToVisible(items) {
  const visible = new Set(items.map((bookmark) => bookmark.id));
  for (const id of [...state.selectedBookmarkIds]) {
    if (!visible.has(id)) {
      state.selectedBookmarkIds.delete(id);
    }
  }
}

function toggleSelectAllVisible() {
  const visibleIds = state.filteredBookmarks.map((bookmark) => bookmark.id);
  if (visibleIds.length === 0) {
    return;
  }

  const allVisibleSelected = visibleIds.every((id) => state.selectedBookmarkIds.has(id));
  if (allVisibleSelected) {
    for (const id of visibleIds) {
      state.selectedBookmarkIds.delete(id);
    }
  } else {
    for (const id of visibleIds) {
      state.selectedBookmarkIds.add(id);
    }
  }

  syncBulkActions();
  updateSelectedBookmarkStyles();
}

function syncScopedModeControls() {
  const inScopedMode = Boolean(state.scopedBookmarkIds && state.scopedBookmarkIds.size > 0);
  els.showAllBtn.hidden = !inScopedMode;
}

function syncBulkActions() {
  const selectedCount = state.selectedBookmarkIds.size;
  els.selectedCount.textContent = t("selectedLabel", { count: selectedCount });

  const hasSelection = selectedCount > 0;
  els.moveSelectedBtn.disabled = !hasSelection;
  els.deleteSelectedBtn.disabled = !hasSelection;
  els.clearSelectionBtn.disabled = !hasSelection;
  els.moveFolderSelect.disabled = !hasSelection;
}

function normalizeUrlForDedup(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";

    const normalizedParams = [...parsed.searchParams.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
    parsed.search = "";
    for (const [key, value] of normalizedParams) {
      parsed.searchParams.append(key, value);
    }

    const normalizedPath = parsed.pathname.length > 1
      ? parsed.pathname.replace(/\/+$/, "")
      : parsed.pathname;

    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${normalizedPath}${parsed.search}`;
  } catch {
    return (url || "").trim().toLowerCase();
  }
}

function selectDuplicateBookmarks() {
  const groups = new Map();

  for (const bookmark of state.allBookmarks) {
    const key = normalizeUrlForDedup(bookmark.url);
    if (!key) {
      continue;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(bookmark);
  }

  const duplicateCandidates = [];
  const duplicateGroupById = new Map();
  let groupIndex = 0;

  for (const [key, group] of groups.entries()) {
    if (group.length < 2) {
      continue;
    }

    group.sort((a, b) => Number(b.dateAdded || 0) - Number(a.dateAdded || 0));
    const removable = group.slice(1);
    if (removable.length === 0) {
      continue;
    }

    groupIndex += 1;
    for (const bookmark of removable) {
      duplicateCandidates.push(bookmark);
      duplicateGroupById.set(bookmark.id, {
        key,
        groupIndex,
        totalInGroup: group.length
      });
    }
  }

  if (duplicateCandidates.length === 0) {
    state.scopedBookmarkIds = null;
    state.duplicateGroupById = new Map();
    showToast(t("noDuplicatesFound"));
    return;
  }

  state.selectedBookmarkIds = new Set(duplicateCandidates.map((bookmark) => bookmark.id));
  state.scopedBookmarkIds = new Set(duplicateCandidates.map((bookmark) => bookmark.id));
  state.duplicateGroupById = duplicateGroupById;

  // Reveal duplicate selection even if user had filters/folder scope applied.
  state.query = "";
  els.searchInput.value = "";
  state.selectedFolderId = null;
  state.domainFilter = "all";
  state.recencyFilter = "all";
  els.domainFilter.value = "all";
  els.recencyFilter.value = "all";

  state.selectedBookmarkId = duplicateCandidates[0]?.id || null;

  render();
  if (state.selectedBookmarkId) {
    setSelectedBookmarkId(state.selectedBookmarkId, { scroll: true });
  }
  showToast(`${formatDuplicateSelectionCount(duplicateCandidates.length)} • ${t("showingDuplicates")}`);
}


async function deleteSelectedBookmarks() {
  const ids = [...state.selectedBookmarkIds];
  if (ids.length === 0) {
    return;
  }

  const confirmed = confirm(t("deleteSelectedConfirm", { count: ids.length }));
  if (!confirmed) {
    return;
  }

  const index = new Map(state.allBookmarks.map((bookmark) => [bookmark.id, bookmark]));
  const snapshots = [];
  let deletedCount = 0;

  for (const id of ids) {
    const bookmark = index.get(id);
    if (!bookmark) {
      continue;
    }

    snapshots.push({
      title: bookmark.title,
      url: bookmark.url,
      parentId: bookmark.parentId
    });

    await chrome.bookmarks.remove(id);
    applyDeletedBookmark(bookmark);
    deletedCount += 1;
  }

  state.selectedBookmarkIds.clear();
  await persistLinkHealth();
  if (state.scopedBookmarkIds) {
    state.scopedBookmarkIds = new Set([...state.scopedBookmarkIds].filter((id) => !ids.includes(id)));
    if (state.scopedBookmarkIds.size === 0) {
      state.scopedBookmarkIds = null;
      state.duplicateGroupById = new Map();
    }
  }
  syncDomainOptions();
  render();

  if (deletedCount > 0) {
    showToast(formatDeletedSelectionCount(deletedCount), {
      actionLabel: t("undo"),
      onAction: () => restoreDeletedBookmarks(snapshots),
      durationMs: 5000
    });
  }
}


async function moveBookmarksToFolder(bookmarkIds, folderId) {
  if (!folderId || bookmarkIds.length === 0) {
    return;
  }

  const previousParents = [];
  let movedCount = 0;

  for (const bookmarkId of bookmarkIds) {
    const bookmark = state.allBookmarks.find((entry) => entry.id === bookmarkId);
    if (!bookmark || bookmark.parentId === folderId) {
      continue;
    }

    previousParents.push({ id: bookmarkId, fromParentId: bookmark.parentId });
    await chrome.bookmarks.move(bookmarkId, { parentId: folderId });
    applyMovedBookmark(bookmark, folderId);
    movedCount += 1;
  }

  if (state.scopedBookmarkIds) {
    state.scopedBookmarkIds = new Set([...state.scopedBookmarkIds].filter((id) => !bookmarkIds.includes(id)));
    if (state.scopedBookmarkIds.size === 0) {
      state.scopedBookmarkIds = null;
      state.duplicateGroupById = new Map();
    }
  }

  render();
  if (movedCount > 0) {
    showToast(formatMovedCount(movedCount), {
      actionLabel: t("undo"),
      onAction: () => undoBookmarkMove(previousParents),
      durationMs: 5000
    });
  }
}


function adjustFolderTotals(trailIds, delta) {
  for (const folderId of trailIds) {
    const folder = state.folderById.get(folderId);
    if (!folder) {
      continue;
    }
    folder.totalBookmarks = Math.max(0, folder.totalBookmarks + delta);
  }
}

function getFolderContext(parentId) {
  if (!parentId || !state.folderById.has(parentId)) {
    return {
      parentPath: "",
      folderTrailIds: []
    };
  }

  const folder = state.folderById.get(parentId);
  return {
    parentPath: folder.path,
    folderTrailIds: [...folder.ancestorIds, parentId]
  };
}

function applyCreatedBookmark(node) {
  const parentId = node.parentId || null;
  const folderContext = getFolderContext(parentId);

  const bookmark = {
    id: node.id,
    title: node.title || "(untitled)",
    url: node.url,
    domain: safeDomain(node.url),
    parentPath: folderContext.parentPath,
    parentId,
    folderTrailIds: folderContext.folderTrailIds,
    dateAdded: node.dateAdded || Date.now(),
    searchText: buildSearchText(node.title || "(untitled)", node.url, folderContext.parentPath),
    searchNormalized: normalizeForSearch(buildSearchText(node.title || "(untitled)", node.url, folderContext.parentPath))
  };

  state.allBookmarks.push(bookmark);
  adjustFolderTotals(bookmark.folderTrailIds, 1);
  state.selectedBookmarkId = bookmark.id;
}

function applyEditedBookmark(bookmarkId, title, url) {
  const bookmark = state.allBookmarks.find((entry) => entry.id === bookmarkId);
  if (!bookmark) {
    return;
  }

  bookmark.title = title || "(untitled)";
  bookmark.url = url;
  bookmark.domain = safeDomain(url);
  bookmark.searchText = buildSearchText(bookmark.title, url, bookmark.parentPath);
  bookmark.searchNormalized = normalizeForSearch(bookmark.searchText);
  delete state.linkHealthById[String(bookmarkId)];
}

function applyDeletedBookmark(bookmark) {
  state.allBookmarks = state.allBookmarks.filter((entry) => entry.id !== bookmark.id);
  adjustFolderTotals(bookmark.folderTrailIds, -1);
  state.favorites.delete(bookmark.id);
  state.selectedBookmarkIds.delete(bookmark.id);
  delete state.linkHealthById[String(bookmark.id)];
  state.duplicateGroupById.delete(bookmark.id);

  if (state.selectedBookmarkId === bookmark.id) {
    state.selectedBookmarkId = state.filteredBookmarks.find((entry) => entry.id !== bookmark.id)?.id || null;
  }

  persistFavorites();
}

function applyMovedBookmark(bookmark, newParentId) {
  adjustFolderTotals(bookmark.folderTrailIds, -1);

  const folderContext = getFolderContext(newParentId);
  bookmark.parentId = newParentId;
  bookmark.parentPath = folderContext.parentPath;
  bookmark.folderTrailIds = folderContext.folderTrailIds;
  bookmark.searchText = buildSearchText(bookmark.title, bookmark.url, bookmark.parentPath);
  bookmark.searchNormalized = normalizeForSearch(bookmark.searchText);

  adjustFolderTotals(bookmark.folderTrailIds, 1);
}

function getFilteredBookmarks() {
  return filterAndSortBookmarks({
    bookmarks: state.allBookmarks,
    selectedFolderId: state.selectedFolderId,
    query: state.query,
    sort: state.sort,
    favorites: state.favorites,
    domainFilter: state.domainFilter,
    recencyDays: state.recencyFilter
  });
}

function updateSelectedFolderLabel() {
  const folder = state.folders.find((entry) => entry.id === state.selectedFolderId);
  const targetLabel = folder?.path || t("allFolders");
  els.selectedFolderLabel.textContent = `${t("targetFolder")}: ${targetLabel}`;

  if (state.selectedFolderId && state.folderById.has(state.selectedFolderId)) {
    els.moveFolderSelect.value = state.selectedFolderId;
  }
}

function getSuggestedFolderIdByUrl(url) {
  const domain = normalizeForSearch(safeDomain(url));
  if (!domain || domain === "unknown site") {
    return null;
  }

  const byFolder = new Map();
  for (const bookmark of state.allBookmarks) {
    if (!bookmark.parentId) {
      continue;
    }

    if (normalizeForSearch(bookmark.domain) !== domain) {
      continue;
    }

    byFolder.set(bookmark.parentId, (byFolder.get(bookmark.parentId) || 0) + 1);
  }

  let winnerId = null;
  let winnerCount = 0;
  for (const [folderId, count] of byFolder.entries()) {
    if (count > winnerCount) {
      winnerId = folderId;
      winnerCount = count;
    }
  }

  return winnerId;
}

function getCreateTargetFolderId(url = "") {
  if (state.selectedFolderId) {
    return state.selectedFolderId;
  }

  const suggested = getSuggestedFolderIdByUrl(url);
  if (suggested && state.folderById.has(suggested)) {
    return suggested;
  }

  return state.preferredFolderId;
}

async function bookmarkCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !tab?.title) {
    showToast(t("couldNotReadTab"));
    return;
  }

  const parentId = getCreateTargetFolderId(tab.url);
  const createDetails = parentId
    ? { parentId, title: tab.title, url: tab.url }
    : { title: tab.title, url: tab.url };

  const created = await chrome.bookmarks.create(createDetails);
  applyCreatedBookmark(created);
  trackEvent("first_bookmark_create", { source: "current_tab" });
  render();
  showToast(t("currentTabBookmarked"));
}

async function loadFavorites() {
  const localStored = await chrome.storage.local.get("favoriteBookmarks");
  let favoriteBookmarks = Array.isArray(localStored.favoriteBookmarks) ? localStored.favoriteBookmarks : [];

  if (state.syncEnabled) {
    const syncStored = await chrome.storage.sync.get("favoriteBookmarks");
    if (Array.isArray(syncStored.favoriteBookmarks)) {
      favoriteBookmarks = syncStored.favoriteBookmarks;
    }
  }

  state.favorites = new Set(favoriteBookmarks);
}

async function persistFavorites() {
  const payload = { favoriteBookmarks: [...state.favorites] };
  await chrome.storage.local.set(payload);
  if (state.syncEnabled) {
    await chrome.storage.sync.set(payload);
  }
}

async function toggleFavorite(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
  } else {
    state.favorites.add(id);
  }
  await persistFavorites();
}

function sanitizeCollapsedFolders() {
  const next = [...state.collapsedFolders].filter((id) => state.folderById.has(id));
  if (next.length === state.collapsedFolders.size) {
    return;
  }

  state.collapsedFolders = new Set(next);
  persistCollapsedFolders();
}

async function persistCollapsedFolders() {
  await chrome.storage.local.set({ collapsedFolderIds: [...state.collapsedFolders] });
}

async function loadSettings() {
  const stored = await chrome.storage.local.get({
    analyticsEnabled: true,
    theme: "sapphire",
    collapsedFolderIds: [],
    uiLanguage: "auto",
    syncEnabled: false,
    density: "comfortable",
    showDateMeta: false,
    linkHealthById: {},
    onboardingCompleted: false
  });

  state.analyticsEnabled = Boolean(stored.analyticsEnabled);
  state.syncEnabled = Boolean(stored.syncEnabled);
  state.theme = stored.theme || "sapphire";
  state.collapsedFolders = new Set(Array.isArray(stored.collapsedFolderIds) ? stored.collapsedFolderIds : []);
  state.uiLanguage = stored.uiLanguage === "pt" || stored.uiLanguage === "en" || stored.uiLanguage === "es" ? stored.uiLanguage : "auto";
  state.density = stored.density === "compact" ? "compact" : "comfortable";
  state.showDateMeta = Boolean(stored.showDateMeta);
  state.linkHealthById = stored.linkHealthById && typeof stored.linkHealthById === "object" ? stored.linkHealthById : {};
  state.onboardingCompleted = Boolean(stored.onboardingCompleted);

  if (state.syncEnabled) {
    const syncStored = await chrome.storage.sync.get({
      theme: state.theme,
      uiLanguage: state.uiLanguage,
      density: state.density,
      showDateMeta: state.showDateMeta,
      linkHealthById: state.linkHealthById
    });

    state.theme = syncStored.theme || state.theme;
    state.uiLanguage = syncStored.uiLanguage === "pt" || syncStored.uiLanguage === "en" || syncStored.uiLanguage === "es" ? syncStored.uiLanguage : state.uiLanguage;
    state.density = syncStored.density === "compact" ? "compact" : state.density;
    state.showDateMeta = Boolean(syncStored.showDateMeta);
    if (syncStored.linkHealthById && typeof syncStored.linkHealthById === "object") {
      state.linkHealthById = syncStored.linkHealthById;
    }
  }

  await applyTheme(state.theme, false);
}

async function applyTheme(themeName, persist) {
  const supportedThemes = new Set(["sapphire", "graphite", "sunset", "mint"]);
  state.theme = supportedThemes.has(themeName) ? themeName : "sapphire";
  document.documentElement.dataset.theme = state.theme;

  const labels = {
    sapphire: "Sapphire",
    graphite: "Graphite",
    sunset: "Sunset",
    mint: "Mint"
  };
  els.themeMenuLabel.textContent = labels[state.theme];
  if (els.themeMenuPrefix) {
    els.themeMenuPrefix.textContent = t("theme");
  }

  const options = els.themeMenu.querySelectorAll(".theme-option");
  for (const option of options) {
    option.classList.toggle("active", option.dataset.themeValue === state.theme);
  }

  if (persist) {
    await persistUserPreferences();
  }
}

function trackEvent(name, payload = {}) {
  if (!state.analyticsEnabled) {
    return;
  }

  const event = {
    name,
    payload,
    ts: Date.now(),
    version: chrome.runtime.getManifest().version
  };

  chrome.storage.local.get({ analyticsEvents: [] }).then(({ analyticsEvents }) => {
    const next = [...analyticsEvents, event].slice(-1000);
    return chrome.storage.local.set({ analyticsEvents: next });
  }).catch((error) => {
    console.error("analytics_error", error);
  });
}

let toastTimer = null;
function showToast(message, { actionLabel = "", onAction = null, durationMs = 1600 } = {}) {
  const token = ++state.undoActionToken;
  const content = document.createElement("span");
  content.className = "toast-content";

  const text = document.createElement("span");
  text.textContent = message;
  content.append(text);

  if (actionLabel && typeof onAction === "function") {
    const actionBtn = document.createElement("button");
    actionBtn.type = "button";
    actionBtn.className = "toast-action";
    actionBtn.textContent = actionLabel;
    actionBtn.addEventListener("click", () => {
      if (token !== state.undoActionToken) {
        return;
      }
      state.undoActionToken += 1;
      els.toast.classList.remove("show");
      void onAction();
    });
    content.append(actionBtn);
  }

  els.toast.innerHTML = "";
  els.toast.append(content);
  els.toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (token === state.undoActionToken) {
      els.toast.classList.remove("show");
    }
  }, durationMs);
}

