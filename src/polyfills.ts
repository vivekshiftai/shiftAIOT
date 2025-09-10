// Polyfills for browser compatibility
// This file should be imported before any other modules that might need these polyfills

// Polyfill for global variable (needed for SockJS)
if (typeof global === 'undefined') {
  (window as any).global = globalThis;
}

// Polyfill for process.env if needed
if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
}

// Ensure Buffer is available if needed
if (typeof Buffer === 'undefined') {
  // Simple Buffer polyfill for basic operations
  (window as any).Buffer = {
    from: (data: any) => new Uint8Array(data),
    isBuffer: (obj: any) => obj instanceof Uint8Array
  };
}

console.log('Polyfills loaded successfully');
