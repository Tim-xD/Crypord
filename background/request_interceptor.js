/**
 * @file Intercept and modify requests
 */

/** @type {Array<string>} Queues of messages modifications to apply */
let receivedQueue = [];
let sentQueue = [];

/** Events listener retrieving the modifications to apply */
addEventListener("crypord_request_received_result", (event) => {
  receivedQueue.push(event.detail);
  event.stopImmediatePropagation();
});
addEventListener("crypord_request_sent_result", (event) => {
  sentQueue.push(event.detail);
  event.stopImmediatePropagation();
});

/**
 * Modify the request according to the modifications
 *
 * @param {Object} request The request
 * @param {Object} modifications The modifications to apply
 */
function modifyRequest(request, modifications) {
  let isString = typeof request === "string";

  if (isString) {
    request = JSON.parse(request);
    isString = true;
  }

  for (const [key, value] of Object.entries(modifications)) {
    Object.defineProperty(request, key, { value: value });
  }

  if (isString) {
    request = JSON.stringify(request);
  }

  return request;
}

/**
 * Modify the body of the message Discord is sending
 *
 * https://stackoverflow.com/questions/26447335/how-can-i-modify-the-xmlhttprequest-responsetext-received-by-another-function
 */
(function () {
  // create XMLHttpRequest proxy object
  let oldXMLHttpRequest = XMLHttpRequest;

  // define constructor for my proxy object
  XMLHttpRequest = function () {
    let actual = new oldXMLHttpRequest();
    let self = this;

    this.onreadystatechange = null;

    // this is the actual handler on the real XMLHttpRequest object
    actual.onreadystatechange = function () {
      if (this.readyState == 4) {
        const url = actual.responseURL;
        if (
          actual.__sentry_xhr_v3__ !== undefined &&
          actual.__sentry_xhr_v3__.method === "GET" &&
          url !== undefined &&
          url.includes("/messages?")
        ) {
          dispatchEvent(
            new CustomEvent("crypord_request_received", {
              detail: {
                response: actual.response,
                responseText: actual.responseText,
              },
            }),
          );

          while (receivedQueue.length === 0) {}

          actual = modifyRequest(actual, receivedQueue.shift());
        }
      }

      if (self.onreadystatechange) {
        return self.onreadystatechange();
      }
    };

    /** Override send method */
    Object.defineProperty(self, "send", {
      value: function () {
        if (arguments[0] !== null && actual.__sentry_xhr_v3__ !== undefined) {
          const url = actual.__sentry_xhr_v3__.url;
          if (
            (actual.__sentry_xhr_v3__.method === "POST" &&
              url.endsWith("/messages")) ||
            (actual.__sentry_xhr_v3__.method === "PATCH" &&
              url.includes("/messages/"))
          ) {
            let message = JSON.parse(arguments[0]);

            if (message.content !== undefined) {
              dispatchEvent(
                new CustomEvent("crypord_request_sent", {
                  detail: {
                    content: message.content,
                  },
                }),
              );

              while (sentQueue.length === 0) {}

              message = modifyRequest(message, sentQueue.shift());
              arguments[0] = JSON.stringify(message);
            }
          }
        }

        return actual["send"].apply(actual, arguments);
      },
    });

    // add all proxy getters
    [
      "status",
      "statusText",
      "responseType",
      "response",
      "readyState",
      "responseXML",
      "upload",
    ].forEach(function (item) {
      Object.defineProperty(self, item, {
        get: function () {
          return actual[item];
        },
      });
    });

    // add all proxy getters/setters
    [
      "ontimeout, timeout",
      "withCredentials",
      "onload",
      "onerror",
      "onprogress",
    ].forEach(function (item) {
      Object.defineProperty(self, item, {
        get: function () {
          return actual[item];
        },
        set: function (val) {
          actual[item] = val;
        },
      });
    });

    // add all pure proxy pass-through methods
    [
      "addEventListener",
      // "send",
      "open",
      "abort",
      "getAllResponseHeaders",
      "getResponseHeader",
      "overrideMimeType",
      "setRequestHeader",
    ].forEach(function (item) {
      Object.defineProperty(self, item, {
        value: function () {
          return actual[item].apply(actual, arguments);
        },
      });
    });
  };
})();
