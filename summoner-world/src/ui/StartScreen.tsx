import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore.ts';
import { ELEMENTS } from '../data/constants.ts';
import type { Element } from '../types/game.ts';
import { createCharacter, SUMMONER_CLASSES, CONTRACT_PATHS, type SummonerClassId, type ContractPath } from '../core/playerCore/characterCreation.ts';

const APPEARANCE_PRESETS = [
  { id: 'default', hair: 'brown', eyes: 'brown', skin: 'light' },
  { id: 'fair', hair: 'blonde', eyes: 'blue', skin: 'fair' },
  { id: 'dark', hair: 'black', eyes: 'dark', skin: 'olive' },
  { id: 'ruthless', hair: 'red', eyes: 'green', skin: 'tan' },
  { id: 'mystic', hair: 'silver', eyes: 'violet', skin: 'pale' },
];

export const StartScreen: React.FC = () => {
  const createChar = useGameStore((s) => s.createCharacter);
  const [name, setName] = useState('Seeker');
  const [className, setClassName] = useState<SummonerClassId>('elementalist');
  const [startingElement, setStartingElement] = useState<Element>('fire');
  const [startingWorldId, setStartingWorldId] = useState(1);
  const [contractPathKey, setContractPathKey] = useState<ContractPath>('companion');
  const [appearanceId, setAppearanceId] = useState('default');

  const selectedClass = SUMMONER_CLASSES[className as keyof typeof SUMMONER_CLASSES];
  const selectedContract = CONTRACT_PATHS[contractPathKey as keyof typeof CONTRACT_PATHS];
  const appearance = APPEARANCE_PRESETS.find((p) => p.id === appearanceId) || APPEARANCE_PRESETS[0];

  const handleCreate = () => {
    if (!name.trim()) return;
    createChar({
      name: name.trim(),
      appearance,
      className,
      startingElement,
      startingWorldId: Number(startingWorldId),
      contractPathKey,
    });
  };

  return (
    <div className="h-screen w-screen bg-gray-950 text-gray-100 flex items-center justify-center font-mono relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(circle at 30% 40%, #6366f1 0%, transparent 50%), radial-gradient(circle at 70% 60%, #8b5cf6 0%, transparent 50%)' }} />
      <div className="border border-gray-700 bg-gray-900/95 p-6 rounded-lg max-w-2xl w-full shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">SUMMONERWORLD</h1>
          <p className="text-xs text-gray-500">Text RPG · Creature Collection · v0.5</p>
        </div>

        <div className="mb-5">
          <label className="block text-sm text-gray-300 mb-1.5 font-semibold">Summoner Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500 placeholder-gray-600"
            placeholder="Enter your name..."
            maxLength={24}
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm text-gray-300 mb-2 font-semibold">Appearance</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {APPEARANCE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setAppearanceId(preset.id)}
                className={`p-2 rounded border text-left transition-all ${
                  appearanceId === preset.id
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-gray-700 bg-gray-950 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="text-[10px] font-black uppercase tracking-widest">{preset.id}</div>
                <div className="text-[9px] text-gray-500 leading-tight">
                  {preset.hair} / {preset.eyes}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm text-gray-300 mb-2 font-semibold">Starting Element</label>
          <div className="flex flex-wrap gap-2">
            {ELEMENTS.map((el) => (
              <button
                key={el}
                onClick={() => setStartingElement(el)}
                className={`px-3 py-1.5 rounded border text-xs font-bold uppercase transition-all ${
                  startingElement === el
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-gray-700 bg-gray-950 text-gray-400 hover:border-gray-600'
                }`}
              >
                {el}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm text-gray-300 mb-2 font-semibold">Summoner Class</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.values(SUMMONER_CLASSES).map((cls) => (
              <button
                key={cls.id}
                onClick={() => setClassName(cls.id)}
                className={`p-2 rounded border text-left transition-all ${
                  className === cls.id
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-gray-700 bg-gray-950 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="text-lg mb-1">{cls.icon}</div>
                <div className="text-[10px] font-black uppercase tracking-widest">{cls.name}</div>
                <div className="text-[9px] text-gray-500 mt-1 leading-tight">{cls.description}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedClass && (
          <div className="mb-5 p-3 bg-gray-950 border border-gray-800 rounded">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Class Attribute Bias</div>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
              {Object.entries(selectedClass.statBias).map(([stat, value]) => (
                <span key={stat} className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-gray-300">
                  {stat} +{value}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-5">
          <label className="block text-sm text-gray-300 mb-2 font-semibold">First Creature Contract Path</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.values(CONTRACT_PATHS).map((path) => (
              <button
                key={path.key}
                onClick={() => setContractPathKey(path.key)}
                className={`p-2 rounded border text-left transition-all ${
                  contractPathKey === path.key
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-gray-700 bg-gray-950 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="text-[10px] font-black uppercase tracking-widest">{path.label}</div>
                <div className="text-[9px] text-gray-500 mt-1 leading-tight">{path.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm text-gray-300 mb-1.5 font-semibold">Starting World</label>
          <input
            type="number"
            min={1}
            max={100}
            value={startingWorldId}
            onChange={(e) => setStartingWorldId(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
            className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white py-2.5 rounded font-semibold transition-all mb-2"
        >
          Create Character
        </button>
        <button
          onClick={() => {
            const loaded = useGameStore.getState().loadGame();
            if (!loaded) alert('No save data found.');
          }}
          className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded transition-colors border border-gray-700"
        >
          Load Save
        </button>
      </div>
    </div>
  );
};
