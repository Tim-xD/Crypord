/**
 * @file Encrypt and decrypt messages
 */

import { getChannelKey, getCurrentId, getServerKey } from "../utils/storage";

let CryptoJS = require("crypto-js");

let id = getCurrentId(window.location.href);
let keys = {};
const retrieveKeys = () => {
  getServerKey(id.server).then((key) => (keys.server = key));
  getChannelKey(id.server, id.channel).then((key) => (keys.channel = key));
};

retrieveKeys();

browser.storage.local.onChanged.addListener(() => retrieveKeys());

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "url_changed") {
    id = getCurrentId(window.location.href);
    retrieveKeys();
  }
});

/**
 * Get key to use for encryption/decryption
 * Choose channel key if possible, else server key
 *
 * @returns {string} The key to use, or undefined
 */
function getKey() {
  if (keys === undefined) {
    return;
  }

  if (keys.channel === undefined || keys.channel === "") {
    return keys.server;
  }

  return keys.channel;
}

/**
 * Dict of encryption functions
 *
 * @param {string} message The message to encrypt
 * @returns {string} The encrypted message, or undefined on error
 */
const encryption = {
  PLAIN: (message) => {
    return message;
  },
  AES: (message) => {
    const key = getKey();
    if (key === undefined) {
      return;
    }

    return CryptoJS.AES.encrypt(message, key).toString();
  },
};

/**
 * Dict of decryption functions
 *
 * @param {string} message The message to decrypt
 * @returns {string} The decrypted message, or undefined on error
 */
const decryption = {
  PLAIN: (message) => {
    return message;
  },
  AES: (message) => {
    const key = getKey();
    if (key === undefined) {
      return;
    }

    const decrypted = CryptoJS.AES.decrypt(message, key);
    try {
      const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);

      if (decryptedStr !== "") {
        return decryptedStr;
      }
    } catch (e) {}
  },
};

/**
 * Encrypt a message
 *
 * @param {string} message The message to decrypt
 * @returns {string} The decrypted message
 */
export function encryptMessage(message) {
  if (message === "") {
    return "";
  }

  for (const [algo, lambda] of Object.entries(encryption)) {
    if (message.startsWith(`/${algo} `)) {
      const encrypted = lambda(message.substring(algo.length + 2));

      if (encrypted !== undefined) {
        return `/${algo} ${encrypted}`;
      }
    }
  }

  const encrypted = encryption.AES(message);

  if (encrypted === undefined) {
    return `/PLAIN ${encryption.PLAIN(message)}`;
  }

  return `/AES ${encrypted}`;
}

/**
 * Decrypt a message
 *
 * @param {string} message The message to decrypt
 * @returns {string} The decrypted message if it has the a valid algorithm
 */
export function decryptMessage(message) {
  for (const [algo, lambda] of Object.entries(decryption)) {
    if (message.startsWith(`/${algo} `)) {
      return lambda(message.substring(algo.length + 2));
    }
  }
}
