import React from 'react';
import { useGameStore } from '../stores/gameStore';

export const GymPanel: React.FC = () => {
  const { player, train } = useGameStore();

  if (!player) return null;

  const stats = [
    { key: 'strength', label: 'Strength', desc: 'Increases damage dealt.' },
    { key: 'defense', label: 'Defense', desc: 'Reduces damage taken.' },
    { key: 'speed', label: 'Speed', desc: 'Increases hit chance and dodge.' },
    { key: 'dexterity', label: 'Dexterity', desc: 'Increases critical hit chance.' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-black text-white italic tracking-tighter mb-1">Combat Dojo</h2>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Enhance your physical and spiritual vessel</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div key={stat.key} className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800 hover:border-emerald-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-1 group-hover:text-emerald-400 transition-colors">{stat.label}</h3>
                <div className="text-3xl font-black text-white tracking-tighter italic">{(player as any)[stat.key]?.toFixed(2)}</div>
              </div>
              <span className="text-2xl opacity-20 group-hover:opacity-40 transition-opacity">
                {stat.key === 'strength' ? '⚔️' : stat.key === 'defense' ? '🛡️' : stat.key === 'speed' ? '👟' : '🎯'}
              </span>
            </div>
            
            <p className="text-xs text-gray-400 mb-6 leading-relaxed h-8">{stat.desc}</p>
            
            <div className="flex gap-2">
              {[5, 10, 25].map((energy) => (
                <button
                  key={energy}
                  onClick={() => train(stat.key as any, energy)}
                  disabled={player.energy.current < energy}
                  className="flex-1 py-2.5 bg-gray-950 hover:bg-emerald-600/20 text-emerald-400 border border-gray-800 hover:border-emerald-500/50 disabled:opacity-20 disabled:grayscale rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  -{energy} NRG
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
