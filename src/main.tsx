import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './Components/App';
import Navbar from './Components/Navbar';
import { ThemeProvider } from './contexts/ThemeContext';

window.addEventListener('api-ready', () => {
  // The API is ready, you can now initialize your app
  console.log('API is ready, initializing app');
  // If you need to reload:
  // window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
