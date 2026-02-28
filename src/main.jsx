import './utils/clickfix.js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initStorage } from './utils/storage';
import { initSplash } from './utils/splash';
import './styles/index.css';

// Initialise Capacitor storage shim (before React mounts)
initStorage();

// Dismiss native splash, trigger animated splash
initSplash();

// Auto-add has-value class to date inputs
document.addEventListener('change', (e) => {
  if (e.target.type === 'date') {
    e.target.classList.toggle('has-value', !!e.target.value);
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
