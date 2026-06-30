import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { getXPThreshold } from '../core/xpCurve';

function toBigIntXP(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return BigInt(Math.trunc(value));
  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      return BigInt(value);
    } catch {
      return 0n;
    }
  }
  return 0n;
}

export const ResourcePanel: React.FC = () => {
  const player = useGameStore((state) => state.player);

  if (!player) return null;

  const renderBar = (label: string, current: number, max: number, color: string) => {
    const percentage = Math.min(100, (current / max) * 100);
    return (
      <div className="flex-1 min-w-0">
        <div className="w-full bg-gray-900 h-6 border border-gray-800 relative group overflow-hidden">
          <div 
            className={`h-full ${color} transition-all duration-700 ease-out relative shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]`} 
            style={{ width: `${percentage}%` }}
          >
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
            <span className="text-[10px] font-black text-white uppercase tracking-tighter drop-shadow-md">{label}</span>
            <span className="text-[10px] font-mono text-white font-bold drop-shadow-md">{Math.floor(percentage)}%</span>
          </div>
        </div>
      </div>
    );
  };

  const nextLevelXP = getXPThreshold(player.level);
  const playerXP = toBigIntXP(player.experience);
  const xpPercentage = nextLevelXP > 0n
    ? Math.min(100, Number((playerXP * 100n) / nextLevelXP))
    : 0;

  return (
    <div className="flex gap-1 w-full bg-black/40 p-1 border-t border-gray-800">
      {renderBar('Life', player.life.current, player.life.max, 'bg-[#cc0000]')}
      {renderBar('Energy', player.energy.current, player.energy.max, 'bg-[#0044cc]')}
      {renderBar('Happy', player.happy.current, player.happy.max, 'bg-[#990099]')}
      {renderBar('Nerve', player.nerve.current, player.nerve.max, 'bg-[#cccc00]')}
      <div className="flex-1 min-w-0">
        <div className="w-full bg-gray-900 h-6 border border-gray-800 relative group overflow-hidden">
          <div 
            className="h-full bg-[#ffd700] transition-all duration-700 ease-out relative shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" 
            style={{ width: `${xpPercentage}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
            <span className="text-[10px] font-black text-white uppercase tracking-tighter drop-shadow-md">XP</span>
            <span className="text-[10px] font-mono text-white font-bold drop-shadow-md">{Math.floor(xpPercentage)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
