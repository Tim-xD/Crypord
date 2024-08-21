let CryptoJS = require("crypto-js");

let server_input = document.getElementById("server_key");
let channel_input = document.getElementById("channel_key");

browser.storage.local.get("server_key").then((elt) => {
  if (elt.server_key === undefined) {
    server_input.value = CryptoJS.lib.WordArray.random(256 / 8).toString();
    browser.storage.local.set({
      server_key: server_input.value,
    });
  } else {
    server_input.value = elt.server_key;
  }
});

browser.storage.local.get("channel_key").then((elt) => {
  if (elt.channel_key === undefined) {
    channel_input.value = CryptoJS.lib.WordArray.random(256 / 8).toString();
    browser.storage.local.set({
      channel_key: channel_input.value,
    });
  } else {
    channel_input.value = elt.channel_key;
  }
});

server_input.addEventListener("change", (event) => {
  browser.storage.local.set({ server_key: event.target.value });
});

channel_input.addEventListener("change", (event) => {
  browser.storage.local.set({ channel_key: event.target.value });
});

[256, 512, 1024, 2048].forEach((key_len) => {
  document
    .getElementById("generate_key_" + key_len)
    .addEventListener("click", (event) => {
      navigator.clipboard.writeText(
        CryptoJS.lib.WordArray.random(key_len / 8).toString(),
      );
      document.getElementById("copied_key_" + key_len).style.display =
        "inline-block";
    });
});
