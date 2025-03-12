// @ts-ignore
import React from 'react';
// @ts-ignore
import ReactDOM from 'react-dom/client';
// @ts-ignore
import { BrowserRouter } from 'react-router-dom';
import './polyfills'; // Must be imported early to ensure Buffer is available
import App from './App';
import { AppContextProvider } from './contexts/AppContext';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </BrowserRouter>
  </React.StrictMode>
); 