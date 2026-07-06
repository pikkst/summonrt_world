import React from 'react';
import { computeMinimapCells } from '../core/minimap.ts';
import type { WorldData } from '../types/game.ts';

function getBiomeColor(biome: string): string {
  const colors: Record<string, string> = {
    forest: 'bg-green-900',
    plains: 'bg-lime-900',
    mountains: 'bg-gray-700',
    swamp: 'bg-teal-900',
    desert: 'bg-yellow-800',
    tundra: 'bg-blue-200',
    coast: 'bg-cyan-800',
    volcanic: 'bg-red-900',
    crystal_caves: 'bg-purple-800',
    sky_islands: 'bg-indigo-700',
  };
  return colors[biome] || 'bg-gray-800';
}

interface MinimapProps {
  player: {
    tileX: number;
    tileY: number;
  };
  world: WorldData | undefined;
  radius: number;
  onExpand?: () => void;
}

export const Minimap: React.FC<MinimapProps> = ({ player, world, radius, onExpand }) => {
  if (!world) return null;

  const cells = computeMinimapCells(player.tileX, player.tileY, radius, world);

  const getSpecialIcon = (type: string) => {
    switch (type) {
      case 'city': return '🏙️';
      case 'dungeon': return '🏰';
      case 'cave': return '🕳️';
      case 'monument': return '🗿';
      case 'well': return '⛲';
      case 'ruins': return '🏚️';
      case 'outpost': return '⛺';
      case 'grove': return '🌳';
      case 'shrine': return '⛩️';
      default: return '?';
    }
  };

  const gridSize = radius * 2 + 1;

  return (
    <div className="bg-black/40 p-3 rounded-2xl border border-gray-900 shadow-inner">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {cells.map((cell, idx) => {
          const color = cell.isPlayer
            ? 'bg-white shadow-[0_0_5px_white] z-10 scale-110'
            : cell.discovered
              ? getBiomeColor(cell.biome)
              : 'bg-gray-950/50 border border-gray-900/50';

          const isSpecial = cell.explored && cell.specialType;

          return (
            <div
              key={idx}
              className={`aspect-square rounded-sm transition-all duration-300 ${color} ${!cell.discovered ? 'opacity-20' : ''}`}
              title={cell.discovered ? `${cell.biome}${cell.specialType && cell.explored ? ` - ${cell.specialType}` : ''}` : 'Fog'}
            >
              {!cell.isPlayer && isSpecial && (
                <div className="w-full h-full flex items-center justify-center text-[6px]">
                  {getSpecialIcon(cell.specialType!)}
                </div>
              )}
              {cell.isPlayer && <span className="text-black font-bold text-[8px]">@</span>}
            </div>
          );
        })}
      </div>
      {onExpand && (
        <div className="mt-3 flex justify-between items-center">
          <span className="text-[8px] font-black text-emerald-500/60 uppercase">{player.tileX}, {player.tileY}</span>
          <button onClick={onExpand} className="text-[8px] font-black text-sky-500 uppercase hover:underline">Full Atlas »</button>
        </div>
      )}
    </div>
  );
};
