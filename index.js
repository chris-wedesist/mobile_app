// ULTIMATE CONSOLE PROTECTION - ABSOLUTE FIRST PRIORITY
(function () {
  if (typeof globalThis !== 'undefined') {
    if (!globalThis.console) {
      globalThis.console = {};
    }
    // Create ALL possible console methods immediately
    var methods = [
      'log',
      'error',
      'warning',
      'warn',
      'info',
      'debug',
      'trace',
      'success',
      'dir',
      'dirxml',
      'table',
      'clear',
      'count',
      'countReset',
      'group',
      'groupCollapsed',
      'groupEnd',
      'time',
      'timeEnd',
      'timeLog',
      'assert',
      'profile',
      'profileEnd',
      'memory',
    ];
    for (var i = 0; i < methods.length; i++) {
      var method = methods[i];
      if (typeof globalThis.console[method] !== 'function') {
        globalThis.console[method] = (function (m) {
          return function () {
            try {
              if (
                typeof console !== 'undefined' &&
                typeof console.log === 'function'
              ) {
                var args = Array.prototype.slice.call(arguments);
                console.log('[' + m.toUpperCase() + ']', args.join(' '));
              }
            } catch (e) {}
          };
        })(method);
      }
    }
    if (typeof global !== 'undefined') {
      global.console = globalThis.console;
    }
  }
})();

import 'expo-router/entry';
import './app/polyfills';
import './dev-client-extensions';
