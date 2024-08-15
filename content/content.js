/**
 * @file Load the interceptors to easily bundle them together
 */

browser.runtime.sendMessage({});

import "./html_interceptor.js";
import "./request_processor.js";
