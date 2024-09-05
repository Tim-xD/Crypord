/**
 * @file Encrypt and decrypt the messages intercepted over the network
 */

import { decryptMessage, encryptMessage } from "./encryption";

/** Event listeners retrieving the messages from the webpage */
addEventListener("crypord_request_received", (event) => {
  dispatchEvent(
    new CustomEvent("crypord_request_received_result", {
      detail: processRetrievedMessages(event.detail),
    }),
  );

  event.stopImmediatePropagation();
});

addEventListener("crypord_request_sent", (event) => {
  dispatchEvent(
    new CustomEvent("crypord_request_sent_result", {
      detail: processSendingMessages(event.detail),
    }),
  );

  event.stopImmediatePropagation();
});

/**
 * Modify the body of the message Discord is sending
 *
 * @param {string} body The body to modify
 * @returns {string} The updated body of the request
 */
export function processSendingMessages(body) {
  body.content = encryptMessage(body.content);

  return body;
}

/**
 * Modify the response of previously sent messages while Discord retrieves them
 *
 * @param {string} request Object where the response will be modified
 * @param {Function} fun The encryption of decryption function
 */
export function processRetrievedMessages(request) {
  let messages;

  try {
    messages = JSON.parse(request.response);
  } catch (e) {
    console.warn("processRetrievedMessages: Error while parsing JSON", e);
    return request;
  }

  if (messages !== undefined) {
    Object.defineProperty(request, "response", { writable: true });
    Object.defineProperty(request, "responseText", { writable: true });

    if (Array.isArray(messages)) {
      messages = messages.map((elt) => {
        const decrypted = decryptMessage(elt.content);

        if (decrypted !== undefined) {
          elt.content = decrypted;
        }

        return elt;
      });
    } else {
      const decrypted = decryptMessage(messages.content);

      if (decrypted !== undefined) {
        messages.content = decrypted;
      }
    }

    request.response = JSON.stringify(messages);
    request.responseText = request.response;
  }

  return request;
}
