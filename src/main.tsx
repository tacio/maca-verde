import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './index.css';
import App from './App';

async function start() {
  // Dev-only: ?scenario=…&now=… seeds storage and sets the clock (docs/design/03-tooling.md §4).
  // The dynamic import sits behind import.meta.env.DEV, so production builds drop it.
  if (import.meta.env.DEV) {
    const { applyScenarioFromUrl } = await import('./dev/scenarios');
    applyScenarioFromUrl();
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

start();
