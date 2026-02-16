async function ensureDefaults() {
  const { favoriteBookmarks } = await chrome.storage.local.get("favoriteBookmarks");
  if (!Array.isArray(favoriteBookmarks)) {
    await chrome.storage.local.set({ favoriteBookmarks: [] });
  }
}

async function configureSidePanel() {
  if (!chrome.sidePanel?.setPanelBehavior) {
    return;
  }

  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}

async function getDefaultBookmarkParentId() {
  try {
    const tree = await chrome.bookmarks.getTree();
    const root = tree[0];
    const candidate = root.children?.find((node) => (node.title || "").toLowerCase().includes("bookmark"));
    return candidate?.id || null;
  } catch {
    return null;
  }
}

async function quickSaveActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !tab?.title) {
    return;
  }

  const parentId = await getDefaultBookmarkParentId();
  const payload = parentId
    ? { parentId, title: tab.title, url: tab.url }
    : { title: tab.title, url: tab.url };

  await chrome.bookmarks.create(payload);
}

async function openSidePanelForActiveTab() {
  if (!chrome.sidePanel?.open) {
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return;
  }

  await chrome.sidePanel.open({ tabId: tab.id });
}

async function openQuickCaptureForActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab?.url || !tab?.title) {
    return;
  }

  await chrome.storage.local.set({
    pendingQuickCapture: {
      title: tab.title,
      url: tab.url,
      ts: Date.now()
    }
  });

  await openSidePanelForActiveTab();
}

chrome.commands.onCommand.addListener((command) => {
  if (command === "quick-save-current-tab") {
    void quickSaveActiveTab();
    return;
  }

  if (command === "open-markoo-panel") {
    void openSidePanelForActiveTab();
    return;
  }

  if (command === "quick-capture-modal") {
    void openQuickCaptureForActiveTab();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  void Promise.all([ensureDefaults(), configureSidePanel()]);
});

chrome.runtime.onStartup.addListener(() => {
  void configureSidePanel();
});

void configureSidePanel();
