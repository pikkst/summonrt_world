import React from 'react';
import { useGameStore } from '../stores/gameStore';

export const SummonActsPanel: React.FC = () => {
  const { player, performSummonAct } = useGameStore();

  if (!player) return null;

  const acts = [
    { key: 'minor_ritual', label: 'Minor Ritual', nerve: 2, desc: 'A simple ritual to manifest small energy stones.' },
    { key: 'void_whisper', label: 'Void Whisper', nerve: 4, desc: 'Listening to the void for secrets of the ancients.' },
    { key: 'soul_forge', label: 'Soul Forge', nerve: 7, desc: 'Forging a soul fragment into a usable resource.' },
    { key: 'rift_breach', label: 'Rift Breach', nerve: 12, desc: 'Attempting to breach a small rift for high rewards.' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-black text-white italic tracking-tighter mb-1">Soul Rituals</h2>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Perform forbidden acts to manifest destiny</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {acts.map((act) => (
          <div key={act.key} className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800 hover:border-rose-500/30 transition-all flex items-center justify-between group">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-black text-white italic tracking-tighter group-hover:text-rose-400 transition-colors">{act.label}</h3>
                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase rounded tracking-widest border border-rose-500/20">
                  {act.nerve} Nerve Required
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-md">{act.desc}</p>
            </div>
            
            <button
              onClick={() => performSummonAct(act.key, act.nerve)}
              disabled={player.nerve.current < act.nerve}
              className="px-8 py-4 bg-gray-950 hover:bg-rose-600/20 text-rose-500 border border-gray-800 hover:border-rose-500/50 disabled:opacity-20 disabled:grayscale rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl"
            >
              Invoke
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
