/**
 * @file Encrypt and decrypt messages
 */

let CryptoJS = require("crypto-js");

let key = "B374A26A71490437AA024E4FADD5B497FDFF1A8EA6FF12F6FB65AF2720B59CCF";

browser.storage.local.get("key").then((elt) => {
  if (elt.key === undefined) {
    browser.storage.local.set({ key: key });
  } else {
    key = elt.key ?? key;
  }
});

browser.storage.local.onChanged.addListener((elt) => {
  key = elt.key.newValue;
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
    return CryptoJS.AES.encrypt(message, key).toString();
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
    const decrypted = CryptoJS.AES.decrypt(message, key);
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
