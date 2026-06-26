import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { QUEST_TEMPLATES } from '../data/quests';

export const QuestLogPanel: React.FC = () => {
  const player = useGameStore((s) => s.player);
  const completeQuest = useGameStore((s) => (s as any).completeQuest);
  if (!player) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-4xl font-black text-white italic tracking-tighter mb-1 uppercase">Objective Log</h2>
        <p className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">Your progress through the 100 floors</p>
      </div>

      <div className="space-y-4">
        {player.activeQuests.length === 0 && (
          <div className="text-center py-12 bg-gray-900/20 rounded-3xl border border-gray-800">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No active objectives. Explore to find NPCs.</p>
          </div>
        )}
        {player.activeQuests.map((q) => {
          const template = QUEST_TEMPLATES[q.templateKey];
          const isDone = q.progress >= q.targetProgress;
          return (
            <div key={q.id} className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800 flex justify-between items-center group">
              <div>
                <h3 className="text-lg font-black text-white italic tracking-tighter mb-1">{template?.title}</h3>
                <p className="text-xs text-gray-500 mb-4 max-w-md">{template?.description}</p>
                <div className="flex items-center gap-3">
                   <div className="h-1 w-32 bg-gray-800 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-emerald-500 transition-all duration-500" 
                       style={{ width: `${(q.progress / q.targetProgress) * 100}%` }}
                     ></div>
                   </div>
                   <span className="text-[10px] font-mono text-gray-500">{q.progress} / {q.targetProgress}</span>
                </div>
              </div>
              {isDone && (
                <button 
                  onClick={() => completeQuest(q.id)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-black uppercase tracking-widest rounded-xl"
                >
                  Complete
                </button>
              )}
            </div>
          );
        })}
      </div>

      {player.completedQuests.length > 0 && (
        <div className="mt-12 opacity-40 grayscale">
           <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Completed History</h3>
           <div className="space-y-2">
             {player.completedQuests.map(qKey => (
               <div key={qKey} className="text-xs text-emerald-500/50">✓ {QUEST_TEMPLATES[qKey]?.title}</div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};
