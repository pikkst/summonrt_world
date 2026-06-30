import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { GameShell } from './ui/GameShell.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <GameShell />
  </StrictMode>
);
