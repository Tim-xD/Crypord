let input = document.getElementById("key");

browser.storage.local.get("key").then((elt) => (input.value = elt.key));

input.addEventListener("change", (elt) => {
  browser.storage.local.set({ key: elt.target.value });
});
