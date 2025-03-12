import { Buffer } from 'buffer';

// Add Buffer to Window interface
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

// Ensure global Buffer is available in the browser environment
window.Buffer = window.Buffer || Buffer; 