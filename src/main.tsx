import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { TradeProvider } from './context/TradeContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <TradeProvider>
        <App />
      </TradeProvider>
    </ThemeProvider>
  </StrictMode>,
);
