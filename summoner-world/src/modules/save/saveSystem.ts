import type { GameState, Screen, WorldData } from '../../types/game.ts';

export function saveToLocalStorage(state: GameState): boolean {
  try {
    const payload = {
      player: state.player,
      worlds: Array.from(state.worlds.entries()),
      currentWorldId: state.currentWorldId,
      turnCount: state.turnCount,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('summonerworld-save-v1', JSON.stringify(payload));
    return true;
  } catch (e) {
    console.error('Save failed', e);
    return false;
  }
}

export function loadFromLocalStorage(): GameState | null {
  try {
    const raw = localStorage.getItem('summonerworld-save-v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const worlds = new Map(parsed.worlds as [number, WorldData][]);
    return {
      player: parsed.player,
      worlds,
      currentWorldId: parsed.currentWorldId || 1,
      log: [{ id: 'load-1', turn: 0, text: 'Loaded from previous session.', type: 'system' as const, timestamp: Date.now() }],
      turnCount: parsed.turnCount || 0,
      currentScreen: 'explore' as Screen,
    };
  } catch (e) {
    console.error('Load failed', e);
    return null;
  }
}

export function exportSaveAsJSON(state: GameState): void {
  const payload = {
    player: state.player,
    worlds: Array.from(state.worlds.entries()),
    currentWorldId: state.currentWorldId,
    turnCount: state.turnCount,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `summonerworld-save-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
