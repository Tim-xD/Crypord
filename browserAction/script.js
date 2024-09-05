const {
  getServerKey,
  getChannelKey,
  generateRandomKey,
  getCurrentId,
} = require("../utils/storage");

let server_input = document.getElementById("server_key");
let channel_input = document.getElementById("channel_key");
const urlQuery = { active: true, lastFocusedWindow: true };

browser.tabs.query(urlQuery, (tabs) => {
  const url = tabs[0].url;
  const id = getCurrentId(url);

  getServerKey(id.server).then((key) => {
    server_input.value = key ?? "";
  });
  getChannelKey(id.server, id.channel).then((key) => {
    channel_input.value = key ?? "";
  });
});

server_input.addEventListener("change", (event) => {
  browser.tabs.query(urlQuery, (tabs) => {
    const url = tabs[0].url;
    const id = getCurrentId(url);
    const key = event.target.value;

    if (key === "") {
      browser.storage.local.remove(id.server);
    } else {
      browser.storage.local.set({
        [id.server]: key,
      });
    }
  });
});

channel_input.addEventListener("change", (event) => {
  browser.tabs.query(urlQuery, (tabs) => {
    const url = tabs[0].url;
    const id = getCurrentId(url);
    const key = event.target.value;

    if (key === "") {
      browser.storage.local.remove(`${id.server}/${id.channel}`);
    } else {
      browser.storage.local.set({
        [`${id.server}/${id.channel}`]: key,
      });
    }
  });
});

[256, 512, 1024, 2048].forEach((key_len) => {
  document
    .getElementById("generate_key_" + key_len)
    .addEventListener("click", (event) => {
      navigator.clipboard.writeText(generateRandomKey(256));
      document.getElementById("copied_key_" + key_len).style.display =
        "inline-block";
    });
});
