/**
 * @file Store and retrieves keys from storage
 */

let CryptoJS = require("crypto-js");

/**
 * Get server and channel id
 *
 * @param {string} url The url containing the ids
 * @returns {Object} Dict with the id of the server and the channel: { server: "42", channel: "42" }
 */
export function getCurrentId(url) {
  return url.match(/\/channels\/(?<server>[^/]*)\/(?<channel>[^/]*)/).groups;
}

/**
 * Generate a random key
 *
 * @param {number} len The length of the key to generate
 * @returns {string} The new key
 */
export const generateRandomKey = (len) =>
  CryptoJS.lib.WordArray.random(len / 8).toString();

/**
 * Get the key of the server
 *
 * @param {string} serverId The id of the server
 * @returns {string} The key or undefined
 */
export function getServerKey(serverId) {
  return browser.storage.local.get(serverId).then((server) => {
    return server[serverId];
  });
}

/**
 * Get the key of the channel
 *
 * @param {string} serverId The id of the server
 * @param {string} channelId The id of the channel
 * @returns {string} The key or undefined
 */
export function getChannelKey(serverId, channelId) {
  return browser.storage.local
    .get(`${serverId}/${channelId}`)
    .then((server) => {
      return server[`${serverId}/${channelId}`];
    });
}
