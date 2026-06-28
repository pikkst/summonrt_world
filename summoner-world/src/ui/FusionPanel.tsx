import React, { useState, useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import type { CreatureInstance } from '../types/game';
import { getFusionResult, calculateFusionRarity } from '../data/fusionMatrix';
import { inheritSkills } from '../data/fusionUtils';
import { calculateSynergyEffects, getSynergyNames } from '../data/traitSynergy';
import { BASE_COLORS } from '../data/proceduralIdentity';

interface FusionPreview {
  predictedElement: string | undefined;
  predictedClass: string;
  predictedStats: {
    attack: number;
    defense: number;
    speed: number;
    maxHealth: number;
    maxMana: number;
  };
  inheritedSkills: string[];
  activatedSynergies: string[];
  synergyBonuses: Record<string, number>;
  specialEffects: string[];
}

function calculateFusionPreview(
  c1: CreatureInstance,
  c2: CreatureInstance,
  selectedSkills: string[]
): FusionPreview {
  const elementA = c1.elements?.[0] || 'fire';
  const elementB = c2.elements?.[0] || 'fire';
  const predictedElement = getFusionResult(elementA, elementB);
  
  const predictedClass = calculateFusionRarity(c1.class || 'common', c2.class || 'common');
  
  const bonus = 1.15 + 0.075;
  const predictedStats = {
    attack: Math.floor(Math.max(c1.attack || 10, c2.attack || 10) * bonus),
    defense: Math.floor(Math.max(c1.defense || 5, c2.defense || 5) * bonus),
    speed: Math.floor(Math.max(c1.speed || 5, c2.speed || 5) * bonus),
    maxHealth: Math.floor(Math.max(c1.maxHealth || 50, c2.maxHealth || 50) * bonus),
    maxMana: Math.floor(Math.max(c1.maxMana || 20, c2.maxMana || 20) * bonus),
  };
  
  const inheritedSkills = inheritSkills(c1.skills || [], c2.skills || [], selectedSkills);
  
  const parentTraits = Array.from(new Set([...(c1.traits || []), ...(c2.traits || [])]));
  const { statBonuses, specialEffects } = calculateSynergyEffects(parentTraits);
  const activatedSynergies = getSynergyNames(parentTraits);
  
  return {
    predictedElement,
    predictedClass,
    predictedStats,
    inheritedSkills,
    activatedSynergies,
    synergyBonuses: statBonuses,
    specialEffects,
  };
}

function getElementColor(element: string): string {
  return BASE_COLORS[element as keyof typeof BASE_COLORS] || '#888888';
}

export const FusionPanel: React.FC = () => {
  const { player, breedCreatures, closeModal } = useGameStore();
  const [selectedIds, setSelectedId] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isFusing, setIsFusing] = useState(false);

  const parents = player?.creatures.filter(c => selectedIds.includes(c.id)) ?? [];
  const availableSkills = Array.from(new Set(parents.flatMap(c => c.skills)));
  const essenceCount = player?.inventory.find(i => i.templateKey === 'essence')?.quantity || 0;

  const preview = useMemo(() => {
    if (!player || selectedIds.length !== 2) return null;
    const c1 = player.creatures.find(c => c.id === selectedIds[0]);
    const c2 = player.creatures.find(c => c.id === selectedIds[1]);
    if (!c1 || !c2) return null;
    return calculateFusionPreview(c1, c2, selectedSkills);
  }, [player, selectedIds, selectedSkills]);

  if (!player) return null;

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedId(selectedIds.filter((i) => i !== id));
      const creature = player.creatures.find(c => c.id === id);
      if (creature) {
         setSelectedSkills(selectedSkills.filter(s => !creature.skills.includes(s)));
      }
    } else if (selectedIds.length < 2) {
      setSelectedId([...selectedIds, id]);
    }
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else if (selectedSkills.length < 4) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const startFusion = () => {
    if (selectedIds.length !== 2) return;
    setIsFusing(true);
    setTimeout(() => {
      breedCreatures(selectedIds[0]!, selectedIds[1]!, selectedSkills);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center">
        <h2 className="text-5xl font-black text-white italic tracking-tighter mb-2 uppercase">Soul Forge</h2>
        <p className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">Merge two souls into a superior manifestation</p>
      </div>

      {isFusing ? (
        <div className="py-20 text-center space-y-8">
           <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
              <div className="relative w-full h-full flex items-center justify-center bg-gray-900 border-2 border-emerald-500 rounded-full text-4xl animate-pulse">
                🔮
              </div>
           </div>
           <div className="space-y-2">
              <h3 className="text-2xl font-black text-white italic tracking-tighter animate-pulse uppercase">Stabilizing Soul Link...</h3>
              <p className="text-xs text-gray-500 font-mono tracking-widest">Expect unexpected mutations in the dimensional rift</p>
           </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Selection Area */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Two Subjects ({selectedIds.length}/2)</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Requires 5 Essence</span>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {player.creatures.map(c => {
                  const isSelected = selectedIds.includes(c.id);
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => handleSelect(c.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center group ${isSelected ? 'bg-emerald-500/10 border-emerald-500' : 'bg-gray-900/40 border-gray-800 hover:border-gray-600'}`}
                    >
                      <div>
                        <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">{c.nickname || 'Unnamed Soul'}</h4>
                        <p className="text-[10px] text-gray-500">LVL {c.level} • ATK {c.attack} • DEF {c.defense}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-800 group-hover:border-gray-600'}`}>
                         {isSelected && <span className="text-[10px] text-black font-bold flex items-center justify-center h-full">✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Skill Grafting Area */}
            <div className="space-y-4">
               <div className="flex justify-between items-center px-2">
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Skill Grafting ({selectedSkills.length}/4)</span>
               </div>
               <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 h-full min-h-[300px]">
                 {selectedIds.length < 2 ? (
                   <div className="h-full flex items-center justify-center text-center opacity-20">
                     <p className="text-xs font-black uppercase tracking-widest">Select two souls to view available skills</p>
                   </div>
                 ) : (
                    <>
                      <div className="grid grid-cols-1 gap-2">
                        {availableSkills.map(skill => {
                          const isSelected = selectedSkills.includes(skill);
                          return (
                            <div 
                              key={skill} 
                              onClick={() => toggleSkill(skill)}
                              className={`px-4 py-3 rounded-xl border transition-all cursor-pointer text-xs font-black uppercase tracking-widest flex justify-between items-center ${isSelected ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-black/40 border-gray-800 text-gray-500 hover:border-indigo-500/30'}`}
                            >
                              {skill.replace(/_/g, ' ')}
                              {isSelected && <span className="text-[8px]">ACTIVE</span>}
                            </div>
                          );
                        })}
                      </div>
                      {preview && (
                        <div className="mt-4 space-y-3">
                          <div className="border-t border-gray-800 pt-3">
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Fusion Prediction</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-gray-500">Element:</span>
                              <span className="ml-2 font-bold" style={{ color: getElementColor(preview.predictedElement || 'fire') }}>
                                {preview.predictedElement?.toUpperCase() || 'UNKNOWN'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Class:</span>
                              <span className="ml-2 font-bold text-amber-400">{preview.predictedClass.toUpperCase()}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-[9px]">
                            <div className="text-center"><span className="text-gray-500">ATK</span><div className="font-bold text-red-400">{preview.predictedStats.attack}</div></div>
                            <div className="text-center"><span className="text-gray-500">DEF</span><div className="font-bold text-blue-400">{preview.predictedStats.defense}</div></div>
                            <div className="text-center"><span className="text-gray-500">SPD</span><div className="font-bold text-green-400">{preview.predictedStats.speed}</div></div>
                          </div>
                          {preview.activatedSynergies.length > 0 && (
                            <div className="border-t border-gray-800 pt-2">
                              <span className="text-[9px] font-black text-yellow-400 uppercase">Synergies: {preview.activatedSynergies.join(', ')}</span>
                            </div>
                          )}
                          {preview.inheritedSkills.length > 0 && (
                            <div>
                              <span className="text-[9px] font-black text-gray-400 uppercase">Skills ({preview.inheritedSkills.length}):</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {preview.inheritedSkills.map((s, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded text-[8px] font-bold">{s.replace(/_/g, ' ')}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                 )}
               </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-900 flex flex-col items-center gap-6">
             <div className="flex gap-12 opacity-50">
                <div className="text-center">
                  <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-1">Available Essence</span>
                  <span className={`text-xl font-black italic tracking-tighter ${essenceCount >= 5 ? 'text-emerald-500' : 'text-rose-500'}`}>{essenceCount} / 5</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-1">Success Integrity</span>
                  <span className="text-xl font-black text-white italic tracking-tighter">STABLE</span>
                </div>
             </div>

             <div className="flex gap-4 w-full max-w-md">
                <button 
                  onClick={closeModal}
                  className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 border border-gray-800 rounded-2xl hover:bg-gray-900 transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={selectedIds.length !== 2 || essenceCount < 5 || selectedSkills.length === 0}
                  onClick={startFusion}
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 disabled:grayscale text-black py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-[0_10px_20px_rgba(16,185,129,0.2)]"
                >
                  Initiate Fusion
                </button>
             </div>
          </div>
        </>
      )}
    </div>
  );
};