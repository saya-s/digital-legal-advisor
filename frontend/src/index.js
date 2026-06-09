// This is where the frontend starts.
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { LanguageProvider } from "./i18n/language.js";


// Find the root HTML element and place the React app inside it.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // StrictMode helps catch problems while developing.
  // It runs extra checks that help catch mistakes during development.
  <React.StrictMode>
    {/* Make the chosen language and translated text available to every page. */}
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// Performance tracking can be added here later.
