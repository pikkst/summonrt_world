import React from 'react';
import { useGameStore } from '../stores/gameStore.ts';

export const StatAllocationPanel: React.FC = () => {
  const player = useGameStore((s) => s.player);
  const appendLog = useGameStore((s) => s.appendLog);
  const setScreen = (scr: any) => useGameStore.setState({ screen: scr });

  if (!player) return null;

  const availableStatPoints = player.level - 1; // For now, 1 point per level after level 1

  const handleAllocate = (stat: 'strength' | 'defense' | 'speed' | 'dexterity') => {
    if (availableStatPoints <= 0) {
      appendLog('No available stat points to allocate.', 'warning');
      return;
    }
    
    // In a real game, this would likely be a server call or a more complex local update
    // For now, a simplified local update
    useGameStore.setState(state => {
      if (!state.player) return {};

      const updatedPlayer = {
        ...state.player,
        [stat]: state.player[stat] + 1, // Allocate 1 point
        // Ideally, track spent points separately or recalculate available points based on total level and allocated points
      };

      appendLog(`Allocated 1 point to ${stat.toUpperCase()}!`, 'success');
      return { player: updatedPlayer };
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] border border-gray-900 rounded-lg overflow-hidden font-serif">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-900 flex justify-between items-center bg-black/40">
        <div>
          <h2 className="text-lg font-black tracking-tight text-white uppercase flex items-center gap-2">
            <span>💪</span> Character Stats
          </h2>
          <p className="text-xs text-gray-500 italic mt-0.5">Enhance your physical prowess.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 bg-blue-500/5 border border-blue-500/20 rounded-md text-center">
            <span className="text-[10px] uppercase font-black tracking-widest text-blue-500 block">Available Points</span>
            <span className="text-lg font-bold text-blue-400">{availableStatPoints}</span>
          </div>
          <button 
            onClick={() => setScreen('explore')}
            className="px-3 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs font-black uppercase tracking-widest transition-colors text-white"
          >
            Close
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 p-6 overflow-y-auto bg-black/10">
        <div className="space-y-4 max-w-2xl">
          {/* Stat Row */}
          {[ 'strength', 'defense', 'speed', 'dexterity' ].map((stat) => {
            const statValue = player[stat as keyof typeof player] as number;
            return (
            <div key={stat} className="p-4 border border-gray-900 rounded-lg flex items-center justify-between bg-black/40">
              <div>
                <span className="font-bold text-base text-white uppercase tracking-wider">{stat.charAt(0).toUpperCase() + stat.slice(1)}</span>
                <p className="text-sm text-gray-400 mt-1">Current: <span className="text-emerald-400 font-bold">{statValue}</span></p>
              </div>
              <button
                onClick={() => handleAllocate(stat as 'strength' | 'defense' | 'speed' | 'dexterity')}
                disabled={availableStatPoints <= 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-500 rounded text-sm font-black uppercase tracking-widest text-white transition-colors"
              >
                Allocate (+1)
              </button>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
