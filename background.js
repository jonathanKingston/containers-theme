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
    const containers = await this.getContainers();
    activeTabs.forEach((tab) => {
      const cookieStoreId = tab.cookieStoreId;
      if (!this.isUnpaintedTheme(cookieStoreId)) {
        this.changeTheme(tab.windowId,
          containers.get(cookieStoreId));
      } else {
        this.resetTheme(tab.windowId);
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

  isUnpaintedTheme(cookieStore) {
    return (cookieStore == "firefox-default" ||
            cookieStore == "firefox-private");
  }

  resetTheme(windowId) {
    browser.theme.reset(windowId);
  }

  async changeTheme(windowId, container) {
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
