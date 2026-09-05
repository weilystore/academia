/**
 * Safeguard for browser environments where window.fetch has only a getter
 * on Window.prototype without a setter, which causes strict-mode assignments to throw
 * "TypeError: Cannot set property fetch of #<Window> which has only a getter".
 */
export function initFetchSafeguard(): void {
  if (typeof window === 'undefined') return;

  try {
    const origFetch = window.fetch ? window.fetch.bind(window) : null;
    let currentFetch = origFetch;

    // 1. Prototype setter
    if (typeof Window !== 'undefined' && Window.prototype) {
      const desc = Object.getOwnPropertyDescriptor(Window.prototype, 'fetch');
      if (desc && !desc.set && desc.configurable) {
        Object.defineProperty(Window.prototype, 'fetch', {
          get: function () {
            return currentFetch || (desc.get ? desc.get.call(this) : origFetch);
          },
          set: function (val) {
            currentFetch = val;
          },
          configurable: true,
          enumerable: true,
        });
      }
    }

    // 2. Window own property setter
    try {
      Object.defineProperty(window, 'fetch', {
        get: function () {
          return currentFetch;
        },
        set: function (val) {
          currentFetch = val;
        },
        configurable: true,
        enumerable: true,
      });
    } catch {
      // fallback
    }
  } catch (err) {
    console.warn('[Fetch Safeguard] Handled exception:', err);
  }
}

// Automatically execute on import
initFetchSafeguard();
