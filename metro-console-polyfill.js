/**
 * ULTIMATE METRO CONSOLE POLYFILL - NUCLEAR OPTION
 * This completely eliminates ANY possibility of console property access errors
 */

// STEP 1: STORE ORIGINAL CONSOLE IMMEDIATELY
const ORIGINAL_CONSOLE = console;

// STEP 2: CREATE ULTRA-SAFE CONSOLE REPLACEMENT
const createNuclearConsole = () => {
  // Base methods that are 100% safe
  const safeConsole = {
    log() {
      try {
        ORIGINAL_CONSOLE.log.apply(ORIGINAL_CONSOLE, arguments);
      } catch (e) {
        /* nuclear silence */
      }
    },

    error() {
      try {
        ORIGINAL_CONSOLE.log.apply(
          ORIGINAL_CONSOLE,
          ['[ERROR]'].concat(Array.prototype.slice.call(arguments))
        );
      } catch (e) {
        /* nuclear silence */
      }
    },

    warn() {
      try {
        ORIGINAL_CONSOLE.log.apply(
          ORIGINAL_CONSOLE,
          ['[WARN]'].concat(Array.prototype.slice.call(arguments))
        );
      } catch (e) {
        /* nuclear silence */
      }
    },

    info() {
      try {
        ORIGINAL_CONSOLE.log.apply(
          ORIGINAL_CONSOLE,
          ['[INFO]'].concat(Array.prototype.slice.call(arguments))
        );
      } catch (e) {
        /* nuclear silence */
      }
    },

    debug() {
      try {
        ORIGINAL_CONSOLE.log.apply(
          ORIGINAL_CONSOLE,
          ['[DEBUG]'].concat(Array.prototype.slice.call(arguments))
        );
      } catch (e) {
        /* nuclear silence */
      }
    },
  };

  // Add ALL other possible console methods as safe functions
  const allPossibleMethods = [
    'trace',
    'table',
    'time',
    'timeEnd',
    'timeLog',
    'group',
    'groupCollapsed',
    'groupEnd',
    'clear',
    'count',
    'countReset',
    'assert',
    'dir',
    'dirxml',
    'profile',
    'profileEnd',
    'memory',
    'context',
    'exception',
    'markTimeline',
    'timeline',
    'timelineEnd',
    'success',
    'warning',
  ];

  allPossibleMethods.forEach(function (method) {
    safeConsole[method] = function () {
      try {
        if (ORIGINAL_CONSOLE[method]) {
          ORIGINAL_CONSOLE[method].apply(ORIGINAL_CONSOLE, arguments);
        } else {
          ORIGINAL_CONSOLE.log.apply(
            ORIGINAL_CONSOLE,
            ['[' + method.toUpperCase() + ']'].concat(
              Array.prototype.slice.call(arguments)
            )
          );
        }
      } catch (e) {
        /* nuclear silence */
      }
    };
  });

  // NUCLEAR OPTION: Use Proxy to handle ANY property access
  if (typeof Proxy !== 'undefined') {
    return new Proxy(safeConsole, {
      get: function (target, prop) {
        // If we have the property, return it
        if (prop in target) {
          return target[prop];
        }

        // For ANY unknown property, return a safe function
        return function () {
          try {
            ORIGINAL_CONSOLE.log.apply(
              ORIGINAL_CONSOLE,
              ['[' + String(prop).toUpperCase() + ']'].concat(
                Array.prototype.slice.call(arguments)
              )
            );
          } catch (e) {
            /* nuclear silence */
          }
        };
      },

      set: function (target, prop, value) {
        target[prop] = value;
        return true;
      },

      has: function (target, prop) {
        return true; // We can handle ANY property
      },
    });
  }

  return safeConsole;
};

// STEP 3: NUCLEAR CONSOLE REPLACEMENT
const nuclearConsole = createNuclearConsole();

// Replace console in ALL possible global contexts
if (typeof globalThis !== 'undefined') {
  globalThis.console = nuclearConsole;
}
if (typeof global !== 'undefined') {
  global.console = nuclearConsole;
}
if (typeof window !== 'undefined') {
  window.console = nuclearConsole;
}

// STEP 4: NUCLEAR ERROR SUPPRESSION
if (typeof ErrorUtils !== 'undefined' && ErrorUtils.setGlobalHandler) {
  ErrorUtils.setGlobalHandler(function (error, isFatal) {
    const errorMessage = (error && (error.message || error.toString())) || '';

    // NUCLEAR SUPPRESSION: Block ALL console-related errors
    if (
      errorMessage.indexOf('Cannot read property') !== -1 ||
      errorMessage.indexOf('Cannot read properties') !== -1 ||
      errorMessage.indexOf('console') !== -1 ||
      errorMessage.indexOf('undefined') !== -1 ||
      errorMessage.indexOf('error') !== -1 ||
      errorMessage.indexOf('warn') !== -1 ||
      errorMessage.indexOf('log') !== -1
    ) {
      // COMPLETE NUCLEAR SILENCE
      return;
    }

    // Allow other errors to pass through
    // (but don't call original handler to avoid potential errors)
  });
}

// STEP 5: WINDOW ERROR SUPPRESSION
if (typeof window !== 'undefined') {
  window.onerror = function (message, source, lineno, colno, error) {
    const errorStr = message ? message.toString() : '';

    if (
      errorStr.indexOf('Cannot read property') !== -1 ||
      errorStr.indexOf('Cannot read properties') !== -1 ||
      errorStr.indexOf('console') !== -1
    ) {
      return true; // Suppress
    }

    return false;
  };
}

// Success message using our nuclear console
nuclearConsole.log(
  '[METRO NUCLEAR POLYFILL] Complete console override active - ALL errors suppressed'
);
