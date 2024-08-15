browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  browser.scripting.executeScript({
    target: { tabId: sender.tab.id },
    files: ["./background/request_interceptor.js"],
    world: "MAIN",
  });
});
