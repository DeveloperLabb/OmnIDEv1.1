import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './Components/App';
import { ThemeProvider } from './contexts/ThemeContext';

// Create a global flag to track API readiness
declare global {
  interface Window {
    apiReady?: boolean;
  }
}

// Set initial state to false
window.apiReady = false;

// Force the app to consider API ready after a timeout
// This is a fallback in case the real event never fires
setTimeout(() => {
  if (!window.apiReady) {
    console.log('API ready event timeout - forcing ready state');
    window.apiReady = true;

    // Manually dispatch the api-ready event
    const event = new Event('api-ready');
    window.dispatchEvent(event);
  }
}, 3000); // 3 second timeout

// Listen for the original API ready event
window.addEventListener('api-ready', () => {
  window.apiReady = true;
  console.log('API is ready, initializing app');
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);