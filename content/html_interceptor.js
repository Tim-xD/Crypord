/**
 * @file Intercept the messages within the HTML
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver#example
 * https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
 */

import { decryptMessage, encryptMessage } from "./encryption";

/**
 * Escape HTML
 *
 * @param {string} message The message escape
 * @returns {string} The new message
 */
function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Unescape HTML
 *
 * @param {string} message The message unescape
 * @returns {string} The new message
 */
function unescapeHtml(str) {
  return str
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'");
}

/**
 * Wait for an HTML element to load
 *
 * @param {string} selector The query selector of the element to wait for
 * @returns {Promise}
 */
function waitForElement(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

/**
 * Replace the HTML of the message to decrypt it
 *
 * @param {Object} container The div containing the message
 */
function showDecryptedMessage(container) {
  let messageEncrypted = "";

  Array.from(container.children).forEach((span) => {
    // The small '(edited)' after a message
    if (!span.className.startsWith("timestamp")) {
      messageEncrypted += span.innerHTML;
      span.innerHTML = span.innerHTML.replace(/.*/g, "");
    }
  });

  messageEncrypted = unescapeHtml(messageEncrypted);
  const messageDecrypted = decryptMessage(messageEncrypted) ?? messageEncrypted;

  container.firstElementChild.innerHTML =
    container.firstElementChild.innerHTML.replace(
      /.*/g,
      escapeHtml(messageDecrypted),
    );
}

/**
 * Replace the HTML of the message to decrypt it on edition
 *
 * @param {Object} container The div containing the message
 */
function showDecryptedMessageEdition(container) {
  let messageEncrypted = "";

  Array.from(container.children).forEach((span) => {
    // The small '(edited)' after a message
    if (!span.className.startsWith("timestamp")) {
      messageEncrypted += span.innerHTML;

      span.focus();
      span.setAttribute("contentEditable", true);
      document.execCommand("selectAll", false);
      document.execCommand("insertText", false, "");
    }
  });

  messageEncrypted = unescapeHtml(messageEncrypted);
  const messageDecrypted = decryptMessage(messageEncrypted) ?? messageEncrypted;

  container.firstElementChild.focus();
  document.execCommand("insertText", false, escapeHtml(messageDecrypted));
}

/**
 * Listen to mutations and change them
 */
function listenMutations() {
  waitForElement('ol[data-list-id="chat-messages"]').then((targetNode) => {
    // Options for the observer (which mutations to observe)
    const config = { attributes: true, childList: true, subtree: true };

    // Callback function to execute when mutations are observed
    const callback = (mutationList, observer) => {
      for (const mutation of mutationList) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.id !== undefined && node.id.startsWith("chat-messages-")) {
              // Show the sent message
              let container = node.querySelector("div[id^=message-content]");
              if (container !== null && container.children.length !== 0) {
                showDecryptedMessage(container);
              }
            } else if (
              node.localName === "span" &&
              node.parentElement !== null &&
              node.parentElement.id !== undefined &&
              node.parentElement.id.startsWith !== "message-content-"
            ) {
              // Show the message after edition
              let container = node.parentElement;
              if (container !== null && container.children.length !== 0) {
                showDecryptedMessage(container);
              }
            } else if (
              node.dataset !== undefined &&
              node.dataset.slateNode === "element"
            ) {
              // Show the message when editing
              let container = node.querySelector("span[data-slate-leaf=true]");
              if (container !== null && container.children.length !== 0) {
                showDecryptedMessage(container);
              }
            }
          });
        } else if (mutation.type === "attributes") {
        }
      }
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
  });
}

listenMutations();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "url_changed") {
    listenMutations();

    let node = document.querySelector("ol[data-list-id=chat-messages]");

    if (node !== null) {
      Array.from(node.children).forEach((child) => {
        if (child.localName === "li") {
          let container = child.querySelector("div[id^=message-content]");
          if (container !== null && container.children.length !== 0) {
            showDecryptedMessage(container);
          }
        }
      });
    }
  }
});
