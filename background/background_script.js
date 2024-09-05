browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  browser.scripting.executeScript({
    target: { tabId: sender.tab.id },
    files: ["./background/request_interceptor.js"],
    world: "MAIN",
  });
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.tabs.sendMessage(tabId, {
    message: "url_changed",
  });
});
