import { useState, useEffect, StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { useGameStore } from './stores/gameStore.ts';
import { GameShell } from './ui/GameShell.tsx';
import './index.css';

function LoadingFallback() {
  const [ready, setReady] = useState(false);
  const loadGame = useGameStore((s) => s.loadGame);
  
  useEffect(() => {
    const ok = loadGame();
    if (!ok) setReady(true);
    else setReady(true);
  }, [loadGame]);

  if (!ready) return <div className="h-screen w-screen bg-gray-950 text-blue-400 flex items-center justify-center font-mono">Loading...</div>;
  return <GameShell />;
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <LoadingFallback />
  </StrictMode>
);
