/**
 * @file Encrypt and decrypt messages
 */

let CryptoJS = require("crypto-js");

let server_key;

browser.storage.local.get("server_key").then((elt) => {
  if (elt.server_key === undefined) {
    server_key = CryptoJS.lib.WordArray.random(256 / 8).toString();
    browser.storage.local.set({
      server_key: server_key,
    });
  } else {
    server_key = elt.server_key;
  }
});

browser.storage.local.onChanged.addListener((elt) => {
  server_key = elt.server_key.newValue;
});

/**
 * Dict of encryption functions
 *
 * @param {string} message The message to encrypt
 * @returns {string} The encrypted message
 */
const encryption = {
  PLAIN: (message) => {
    return message;
  },
  AES: (message) => {
    return CryptoJS.AES.encrypt(message, server_key).toString();
  },
};

/**
 * Dict of decryption functions
 *
 * @param {string} message The message to decrypt
 * @returns {string} The decrypted message
 */
const decryption = {
  PLAIN: (message) => {
    return message;
  },
  AES: (message) => {
    const decrypted = CryptoJS.AES.decrypt(message, server_key);
    try {
      const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);

      if (decryptedStr !== "") {
        return decryptedStr;
      }
    } catch (e) {
      console.log(
        "Message couldn't be decrypted, either it was not encrypted or you have the wrong password",
      );
    }
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
      return `/${algo} ${lambda(message.substring(algo.length + 2))}`;
    }
  }

  return `/AES ${encryption.AES(message)}`;
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
