// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // Updated path to match component location

import App from './Components/App';
import Navbar from './Components/Navbar';
import { ThemeProvider } from './contexts/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);