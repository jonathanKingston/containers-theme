class containersTheme {
  constructor() {
    browser.runtime.getBrowserInfo().then(info => {
      const version = info.version.match(/^(\d+)/);
      this.useThemePropertiesWhenOlderThanFirefox65 = (version < 65);

      browser.tabs.onActivated.addListener(() => {
        this.getCurrentContainer();
      });
      browser.windows.onFocusChanged.addListener(() => {
        this.getCurrentContainer();
      });

      this.getCurrentContainer();
    });
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

    const theme = {
      images: {
        theme_frame: "",
      },
      colors: {
        frame: container.colorCode,
        tab_background_text: "#111",
      }
    };

    if (this.useThemePropertiesWhenOlderThanFirefox65) {
      this.transformThemeForOlderThanFirefox65(theme);
    }

    return browser.theme.update(windowId, theme);
  }

  transformThemeForOlderThanFirefox65(theme) {
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/theme#Aliases

    theme.images.headerUrl = theme.images.theme_frame;
    theme.colors.accentcolor = theme.colors.frame;
    theme.colors.textcolor = theme.colors.tab_background_text;

    delete theme.images.theme_frame;
    delete theme.colors.frame;
    delete theme.colors.tab_background_text;
  }

}

new containersTheme();
