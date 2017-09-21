class containersTheme {
  constructor() {
    browser.tabs.onActivated.addListener(() => {
      this.getCurrentContainer();
    });
    browser.windows.onFocusChanged.addListener(() => {
      this.getCurrentContainer();
    });
    this.getCurrentContainer();
  }

  async getCurrentContainer() {
    const activeTabs = await browser.tabs.query({
      active: true
    });
    const hasUnpainted = activeTabs.some((tab) => {
      return this.isUnpaintedTheme(tab.cookieStoreId);
    });
    const containers = await this.getContainers();
    if (hasUnpainted) {
      this.resetTheme();
    }
    activeTabs.forEach((tab) => {
      const cookieStoreId = tab.cookieStoreId;
      if (!this.isUnpaintedTheme(cookieStoreId)) {
        this.changeTheme(cookieStoreId,
          tab.windowId,
          containers.get(cookieStoreId));
      }
    });
  }

  async getContainers() {
    const containersMap = new Map();
    const containers = await browser.contextualIdentities.query({});
    containers.forEach((container) => {
      containersMap.set(container.cookieStoreId, container);
    });
    return containersMap;
  }

  isUnpaintedTheme(currentCookieStore) {
    return (currentCookieStore == "firefox-default" ||
            currentCookieStore == "firefox-private");
  }

  resetTheme() {
    // Because of the following, we loop through all active windows after a reset
    // this means when we have unpained tabs the browser flickers
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1401691
    browser.theme.reset();
  }

  async changeTheme(currentCookieStore, windowId, container) {
    this.cachedCookieStore = currentCookieStore;
    return browser.theme.update(windowId, {
      images: {
        headerURL: "",
      },
      colors: {
        accentcolor: container.colorCode,
        textcolor: "#111",
      }
    });
  }

}

new containersTheme();
