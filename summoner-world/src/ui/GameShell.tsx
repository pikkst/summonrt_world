import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useGameStore } from '../stores/gameStore.ts';
import { getTileKey, DIRECTIONS, BIOME_NAMES, RESOURCES } from '../data/constants.ts';
import type { Screen, CreatureInstance, CreatureTemplate } from '../types/game.ts';
import { generateCreatureTemplate } from '../modules/creatures/creatureFactory.ts';
import { SeededRandom } from '../utils/SeededRandom.ts';
import { ResourcePanel } from './ResourcePanel';
import { GymPanel } from './GymPanel';
import { SummonActsPanel } from './SummonActsPanel';
import { LoginScreen } from './LoginScreen';
import { QuestLogPanel } from './QuestLogPanel.tsx';
import { FusionPanel } from './FusionPanel';
import { SkillTreePanel } from './SkillTreePanel';
import { StatAllocationPanel } from './StatAllocationPanel';
import { MissionProgressPanel } from './MissionProgressPanel';

const ELEMENT_COLORS: Record<string, string> = {
  fire: 'text-orange-400',
  water: 'text-blue-400',
  earth: 'text-amber-600',
  air: 'text-cyan-300',
  lightning: 'text-yellow-300',
  iron: 'text-gray-300',
  nature: 'text-green-400',
  ice: 'text-sky-300',
  light: 'text-yellow-200',
  darkness: 'text-purple-400',
};

const CLASS_COLORS: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-500',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-orange-400',
  mythical: 'text-pink-400',
};

export const GameShell: React.FC = () => {
  const player = useGameStore((s) => s.player);
  const worlds = useGameStore((s) => s.worlds);
  const currentWorldId = useGameStore((s) => s.currentWorldId);
  const log = useGameStore((s) => s.log);
  const screen = useGameStore((s) => s.screen);
  const turnCount = useGameStore((s) => s.turnCount);
  const initialized = useGameStore((s) => s.initialized);
  const movePlayer = useGameStore((s) => s.movePlayer);
  const searchArea = useGameStore((s) => s.searchArea);
  const gatherResource = useGameStore((s) => s.gatherResource);
  const captureCreature = useGameStore((s) => s.captureCreature);
  const openCreaturePanel = useGameStore((s) => s.openCreaturePanel);
  const openInventory = useGameStore((s) => s.openInventory);
  const openWorldMap = useGameStore((s) => s.openWorldMap);
  const openDungeon = useGameStore((s) => s.openDungeon);
  const openSettings = useGameStore((s) => s.openSettings);
  const openQuests = useGameStore((s) => s.openQuests);
  const interactNPC = useGameStore((s) => (s as any).interactNPC);
  const breedCreatures = useGameStore((s) => (s as any).breedCreatures);

  const openGym = () => useGameStore.setState({ screen: 'gym' });
  const openActs = () => useGameStore.setState({ screen: 'acts' });
  const closeModal = useGameStore((s) => s.closeModal);
  const appendLog = useGameStore((s) => s.appendLog);
  const attackWithCreature = useGameStore((s) => s.attackWithCreature);
  const selectCreatureForCombat = useGameStore((s) => s.selectCreatureForCombat);
  const combat = useGameStore((s) => s.combat);
  const combatTarget = useGameStore((s) => s.combatTarget);
  const useSkillAction = useGameStore((s) => s.useSkill);
  const fleeCombat = useGameStore((s) => s.fleeCombat);
  const useItemAction = useGameStore((s) => s.useItem);
  const nearbyPlayers = useGameStore((s) => (s as any).nearbyPlayers || []);
  const createMapScroll = useGameStore((s) => (s as any).createMapScroll);

  const exploring = useGameStore((s) => s.exploring);
  const exploreTile = useGameStore((s) => s.exploreTile);
  const activity = useGameStore((s) => s.activity);
  const cancelActivity = useGameStore((s) => s.cancelActivity);
  const capturing = useGameStore((s) => s.capturing);
  const levelUpNotifications = useGameStore((s) => s.levelUpNotifications);
  const clearLevelUpNotifications = useGameStore((s) => s.clearLevelUpNotifications);

  const [input, setInput] = useState('');
  const [exploreProgress, setExploreProgress] = useState(0);
  const [captureProgress, setCaptureProgress] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (levelUpNotifications.length > 0) {
      const timer = setTimeout(() => {
        clearLevelUpNotifications();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [levelUpNotifications, clearLevelUpNotifications]);

  useEffect(() => {
    let interval: any;
    if (exploring) {
      interval = setInterval(() => {
        const now = Date.now();
        const total = exploring.totalDuration;
        const remaining = exploring.endTime - now;
        const progress = Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
        setExploreProgress(progress);
        if (progress >= 100) clearInterval(interval);
      }, 100);
    } else {
      setExploreProgress(0);
    }
    return () => clearInterval(interval);
  }, [exploring]);

  useEffect(() => {
    let interval: any;
    if (capturing) {
      interval = setInterval(() => {
        const now = Date.now();
        const total = capturing.totalDuration;
        const remaining = capturing.endTime - now;
        const progress = Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
        setCaptureProgress(progress);
        if (progress >= 100) clearInterval(interval);
      }, 100);
    } else {
      setCaptureProgress(0);
    }
    return () => clearInterval(interval);
  }, [capturing]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      // Removed the handleCommand for Enter key here as it will be handled by the input's onKeyDown
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [input, screen]);

  const nearbyNames = useMemo(() => {
    const w = worlds.get(currentWorldId);
    if (!w || !player) return [];
    const names: string[] = [];
    for (const [key, t] of w.tiles) {
      const parts = key.split(',');
      if (parts.length < 2) continue;
      const tx = parseInt(parts[0]!);
      const ty = parseInt(parts[1]!);
      if (isNaN(tx) || isNaN(ty)) continue;
      const dist = Math.abs(tx - player.tileX) + Math.abs(ty - player.tileY);
      if (dist <= 3 && t.encounterSeed && dist > 0) {
        const encounterRng = new SeededRandom(t.encounterSeed);
        const creature = generateCreatureTemplate(player.currentWorldId, encounterRng);
        names.push(`Something stirs nearby... (${creature.name})`);
      }
    }
    return names;
  }, [worlds, currentWorldId, player?.tileX, player?.tileY]);

  if (!initialized) {
    return <LoginScreen />;
  }

  if (!player) return <LoginScreen />;

  const world = worlds.get(currentWorldId);
  if (!world) return null;

  const tileKey = getTileKey(player.tileX, player.tileY);
  const tile = world.tiles.get(tileKey);
  const gameTimeMinutes = player?.gameTimeMinutes ?? 420;
  const time = Math.floor(gameTimeMinutes / 60);
  const minute = gameTimeMinutes % 60;
  const timeStr = `${String(time).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  const handleCommand = (cmd: string) => {
    const parts = cmd.split(/\s+/);
    const verb = parts[0];
    const arg = parts[1];

    switch (verb) {
      case 'north':
      case 'n':
        movePlayer(0, -1);
        break;
      case 'south':
      case 's':
        movePlayer(0, 1);
        break;
      case 'east':
      case 'e':
        movePlayer(1, 0);
        break;
      case 'west':
      case 'w':
        movePlayer(-1, 0);
        break;
      case 'search':
      case 'look':
        if (!tile?.explored) {
          appendLog('You must explore this sector first before you can search it.', 'warning');
        } else {
          searchArea();
        }
        break;
      case 'gather':
      case 'collect': {
        if (!tile?.explored) {
          appendLog('Explore this sector first to find resources.', 'warning');
        } else {
          const resKey = arg || (tile?.resourceType as string | undefined);
          if (resKey) gatherResource(resKey);
          else appendLog('Specify a resource (e.g., gather wood)', 'warning');
        }
        break;
      }
      case 'capture':
      case 'catch':
        if (capturing) {
          appendLog('You are already attempting to capture a creature.', 'warning');
        } else if (!tile?.explored) {
          appendLog('Explore this sector first to seek out nearby souls.', 'warning');
        } else {
          captureCreature();
        }
        break;
      case 'creatures':
      case 'party':
      case 'c':
        openCreaturePanel();
        break;
      case 'inventory':
      case 'bag':
      case 'i':
        openInventory();
        break;
      case 'gym':
      case 'dojo':
        openGym();
        break;
      case 'acts':
      case 'crimes':
        openActs();
        break;
      case 'map':
      case 'm':
        openWorldMap();
        break;
      case 'dungeon':
      case 'd':
        openDungeon();
        break;
      case 'settings':
        openSettings();
        break;
      case 'quests':
      case 'q':
        openQuests();
        break;
      case 'save':
        useGameStore.getState().saveGame();
        break;
      case 'forge':
      case 'fusion':
      case 'fuse':
        if (tile?.specialType === 'city') useGameStore.setState({ screen: 'fusion' });
        else appendLog('You must be at a Soul Forge in a city to perform fusion.', 'warning');
        break;
      case 'attack': {
        if (arg === 'with' && parts[2]) {
          const creatureName = parts.slice(2).join(' ');
          const creature = player.creatures.find(c => (c.nickname || 'creature').toLowerCase().includes(creatureName));
          if (creature) {
            const fakeTemplate: CreatureTemplate = {
              key: 'fake_attack_template',
              name: 'Training Dummy',
              class: 'common',
              type: 'construct',
              elements: [],
              baseHealth: 50,
              baseAttack: 8,
              baseDefense: 5,
              baseSpeed: 5,
              baseMana: 20,
              baseExpValue: 10,
              skills: [],
              description: 'A training construct.'
            };
            useGameStore.getState().startCombat(fakeTemplate, `${creatureName || 'wild creature'}`);
          } else {
            appendLog('Creature not found.', 'warning');
          }
        } else {
          appendLog('Usage: attack with <creature name>', 'info');
        }
        break;
      }
      case 'train': {
        if (arg === 'creature' && parts[2]) {
          const creatureName = parts.slice(2).join(' ');
          const creature = player.creatures.find(c => (c.nickname || 'creature').toLowerCase().includes(creatureName));
          if (creature) {
            useGameStore.getState().startActivity('creature_training', 60000, `Your ${creature.nickname} is training hard.`, creature.id);
          } else {
            appendLog('Creature not found.', 'warning');
          }
        } else if (arg === 'physical') {
          useGameStore.getState().startActivity('physical_training', 120000, 'You begin a rigorous physical training regimen.');
        } else {
          appendLog('Usage: train <creature <name>> OR train physical', 'info');
        }
        break;
      }
      case 'rest':
      case 'sleep':
        useGameStore.getState().startActivity('rest', 180000, 'You set up camp and begin resting...');
        break;
      case 'search_tracks':
        useGameStore.getState().startActivity('search_tracks', 90000, 'You meticulously search the area for animal tracks.');
        break;
      case 'search_animals':
        useGameStore.getState().startActivity('search_animals', 90000, 'You quietly stalk through the wilderness, searching for wild creatures.');
        break;
      default:
        appendLog(`Unknown command: ${verb}. Try: north, south, east, west, search, gather, capture, train, rest`, 'warning');
    }
  };

  const getActions = (): { key: string; label: string; action: () => void }[] => {
    const actions: { key: string; label: string; action: () => void }[] = [];
    if (exploring || activity) return []; // No actions while moving or busy

    const WORLD_LIMIT = 2000;
    for (const d of DIRECTIONS) {
      const nx = player.tileX + d.dx;
      const ny = player.tileY + d.dy;
      
      const inBounds = nx >= 0 && nx <= WORLD_LIMIT && ny >= 0 && ny <= WORLD_LIMIT;
      
      if (inBounds) {
        actions.push({ key: d.name, label: `Move ${capitalize(d.name)}`, action: () => movePlayer(d.dx, d.dy) });
      } else {
        actions.push({ key: `edge-${d.name}`, label: `${capitalize(d.name)} (edge)`, action: () => {} });
      }
    }
    
    actions.push({ key: 'search', label: 'Search Area', action: searchArea });
    if (tile?.resourceType && tile.resourceQty && tile.resourceQty > 0) {
      const resName = RESOURCES[tile.resourceType]?.name || tile.resourceType;
      actions.push({ key: 'gather', label: `Gather ${resName}`, action: () => gatherResource(tile.resourceType!) });
    }
    if (tile?.specialType === 'city') {
      actions.push({ key: 'fusion', label: 'Soul Forge (Fusion)', action: () => useGameStore.setState({ screen: 'fusion' }) });
    }

    actions.push(
      { key: 'capture', label: 'Capture Creature', action: captureCreature },
      { key: 'inventory', label: 'Inventory (I)', action: openInventory },
      { key: 'creatures', label: `Creatures (C) [${player.creatures.length}/6]`, action: openCreaturePanel },
      { key: 'map', label: 'World Map (M)', action: openWorldMap },
      { key: 'dungeon', label: 'Dungeon (D)', action: openDungeon },
      { key: 'quests', label: 'Quests (Q)', action: openQuests },
      { key: 'missions', label: 'Missions', action: () => useGameStore.setState({ screen: 'missions' }) },
      { key: 'settings', label: 'Settings (S)', action: openSettings },
    );
    return actions;
  };

  const actions = getActions();
  const activeActions = actions.filter(a => !a.key.includes('blocked'));

  return (
    <div className="flex h-screen bg-[#050505] text-[#d1d5db] font-serif overflow-hidden">
      {levelUpNotifications.length > 0 && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
          <div className="bg-black/90 border-2 border-emerald-500/50 rounded-3xl p-8 max-w-lg w-full mx-4 shadow-[0_0_60px_rgba(16,185,129,0.3)] animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-3xl font-black text-emerald-400 italic tracking-tighter uppercase">Level Up!</h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Creature Evolution</p>
            </div>
            <div className="space-y-3">
              {levelUpNotifications.map((notification, i) => (
                <div key={i} className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <span className="text-sm font-bold text-white">{notification.creatureName}</span>
                  <span className="text-lg font-black text-emerald-400">Lv. {notification.newLevel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR: Character & Status */}
      <div className="w-[280px] border-r border-gray-900 flex flex-col bg-[#080808] shrink-0">
        <div className="p-4 border-b border-gray-900">
          <h2 className="text-xl font-black italic tracking-tighter text-white mb-2 uppercase">Summoner</h2>
          <div className="aspect-square bg-gray-900 border border-gray-800 rounded-lg overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-3 left-3">
              <span className="text-xs font-black text-white uppercase tracking-widest">{player.name}</span>
              <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
                {player.archetype ? `${capitalize(player.archetype)}` : 'Rank: Novice'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Stats Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-gray-500">
              <span>Level</span>
              <span className="text-white">{player.level}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-gray-500">
              <span>Stones</span>
              <span className="text-emerald-500">{player.money.toLocaleString()}</span>
            </div>
          </div>

          {/* Afflictions / Effects */}
          <div>
            <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <span className="w-1 h-1 bg-rose-500 rounded-full"></span>
              Afflictions
            </div>
            <div className="space-y-1">
              <div className="text-[11px] text-gray-500 italic">None active</div>
            </div>
          </div>

          {/* Defences / Buffs */}
          <div>
            <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
              Defences
            </div>
            <div className="space-y-2">
              <div className="px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                Soul Shield
              </div>
            </div>
          </div>
        </div>

        {/* Action Quick Links */}
        <div className="p-4 border-t border-gray-900 grid grid-cols-2 gap-2 bg-black/20">
          <button onClick={openInventory} className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-[10px] font-black uppercase tracking-widest transition-colors">Inv</button>
          <button onClick={openCreaturePanel} className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-[10px] font-black uppercase tracking-widest transition-colors">Souls</button>
          <button onClick={openWorldMap} className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-[10px] font-black uppercase tracking-widest transition-colors">Atlas</button>
          <button onClick={openQuests} className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-[10px] font-black uppercase tracking-widest transition-colors">Tasks</button>
<button onClick={() => useGameStore.setState({ screen: 'skills' })} className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-[10px] font-black uppercase tracking-widest transition-colors">Skills</button>
           <button onClick={() => useGameStore.setState({ screen: 'stats' })} className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-[10px] font-black uppercase tracking-widest transition-colors">Stats</button>
           <button onClick={() => useGameStore.setState({ screen: 'missions' })} className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-[10px] font-black uppercase tracking-widest transition-colors">Missions</button>
         </div>
      </div>

      {/* CENTER COLUMN: Main Console */}
      <div className="flex-1 flex flex-col bg-[#050505] min-w-0 border-r border-gray-900">
        {/* Header / Room Title */}
        <div className="h-14 border-b border-gray-900 bg-black/40 flex items-center justify-between px-8 shrink-0">
           <div className="flex items-center gap-4">
             <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{tile?.biome || 'Mysterious Zone'}</span>
             <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">{world.name}</h2>
           </div>
           <div className="text-[10px] font-mono text-gray-500">
             Region {currentWorldId} · {timeStr}
           </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-12">
            {screen === 'explore' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                {/* Room Description */}
                <div className="prose prose-invert max-w-none">
                  <p className="text-xl leading-relaxed text-[#a1a1aa] font-serif italic">
                    The atmosphere here is thick with elemental residue. You stand upon a patch of <span className="text-emerald-400 font-bold border-b border-emerald-500/20">{tile?.biome}</span> where the boundaries between worlds seem thin.
                  </p>
                  <p className="text-lg leading-relaxed text-[#71717a]">
                    To the <span className="text-sky-400 font-bold cursor-pointer hover:underline" onClick={() => movePlayer(0, -1)}>North</span> and <span className="text-sky-400 font-bold cursor-pointer hover:underline" onClick={() => movePlayer(0, 1)}>South</span>, the landscape stretches towards distant horizons. Shimmering rifts pulse in the air like slow heartbeats.
                  </p>
                </div>

                {/* Nearby Players */}
                {nearbyPlayers.length > 0 && (
                  <div className="mt-4 bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl">
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Nearby Summoners</div>
                    <div className="flex flex-wrap gap-2">
                      {nearbyPlayers.map((p: any) => (
                        <div key={p.username} className="px-3 py-1 bg-blue-500/10 rounded-full text-[10px] font-bold text-blue-300 border border-blue-500/10">
                          {p.username}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exploration / Movement Timer */}
                {exploring && (
                  <div className="mt-8 bg-indigo-900/20 border border-indigo-500/30 p-6 rounded-2xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Sector Transition</h3>
                        <p className="text-xs text-gray-500">Establishing link with sector ({exploring.targetX}, {exploring.targetY})</p>
                      </div>
                      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase rounded tracking-widest border border-indigo-500/20">
                        In Transit
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span className="animate-pulse text-indigo-400">Navigating dimensional rifts...</span>
                        <span>{Math.round(exploreProgress)}% complete</span>
                      </div>
                      <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden p-[2px] border border-gray-800">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-100" 
                          style={{ width: `${exploreProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ground Items / Resources */}
                {tile?.resourceType && (
                  <div className="mt-8 bg-gray-900/20 border border-gray-800/50 p-6 rounded-2xl">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">You see here:</div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{RESOURCES[tile.resourceType]?.icon || '📦'}</span>
                      <div>
                        <div className="text-sm font-bold text-gray-300">{tile.resourceQty}x {RESOURCES[tile.resourceType]?.name}</div>
                        <button onClick={() => gatherResource(tile.resourceType!)} className="text-[10px] text-emerald-500 font-black uppercase tracking-widest hover:underline">Pick up</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Exits */}
                <div className="mt-12 pt-8 border-t border-gray-900">
                   <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4">Visible Exits</div>
                   <div className="flex flex-wrap gap-3">
                     {DIRECTIONS.map(d => {
                       const nx = player.tileX + d.dx;
                       const ny = player.tileY + d.dy;
                       const nk = getTileKey(nx, ny);
                       
                       const WORLD_LIMIT = 2000;
                       const inBounds = nx >= 0 && nx <= WORLD_LIMIT && ny >= 0 && ny <= WORLD_LIMIT;
                       const isTarget = exploring?.tileKey === nk;
                       
                       return (
                         <button 
                           key={d.name}
                           onClick={() => !exploring && movePlayer(d.dx, d.dy)}
                           disabled={!inBounds || (exploring !== null && !isTarget)}
                           className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-all
                             ${isTarget ? 'border-indigo-500 bg-indigo-500 text-white animate-pulse' : 
                               inBounds && !exploring ? 'border-sky-500/30 bg-sky-500/5 text-sky-400 hover:bg-sky-500 hover:text-white' : 
                               'border-gray-900 text-gray-800 opacity-20 grayscale cursor-not-allowed'}`}
                         >
                           {d.name}
                         </button>
                       );
                     })}
                   </div>
                </div>

                 {/* Interactive Points */}
                 <div className="mt-8 flex flex-wrap gap-4">
                    {exploring ? (
                      <div className="text-xs font-black text-indigo-500 uppercase tracking-widest animate-pulse">Establishing Neural Link...</div>
                    ) : capturing ? (
                      <div className="w-full">
                        <div className="flex justify-between text-xs font-black text-rose-500 uppercase tracking-widest mb-1">
                          <span>Binding Soul...</span>
                          <span>{Math.round(captureProgress)}%</span>
                        </div>
                        <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-rose-500/20">
                          <div className="h-full bg-rose-500 transition-all duration-100" style={{ width: `${captureProgress}%` }} />
                        </div>
                      </div>
                    ) : activity ? (
                      <div className="border border-gray-700 p-4 rounded-md bg-black/30 flex items-center gap-4">
                        <span className="text-sm text-indigo-400 animate-pulse">⏳ {activity.message}</span>
                        <button 
                          onClick={cancelActivity}
                          className="px-3 py-1 bg-red-800/30 hover:bg-red-800/50 border border-red-800/50 rounded text-[10px] font-black uppercase tracking-widest text-red-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                     <>
                       <button onClick={searchArea} className="text-xs font-black text-emerald-500 uppercase tracking-widest border-b-2 border-emerald-500/20 pb-1 hover:border-emerald-500 transition-all">Search Area</button>
                       {tile?.resourceType && tile.resourceQty && (
                         <button onClick={() => gatherResource(tile.resourceType!)} className="text-xs font-black text-amber-500 uppercase tracking-widest border-b-2 border-amber-500/20 pb-1 hover:border-amber-500 transition-all">
                           Gather {RESOURCES[tile.resourceType]?.name}
                         </button>
                       )}
                        <button onClick={captureCreature} disabled={!!capturing} className="text-xs font-black text-rose-500 uppercase tracking-widest border-b-2 border-rose-500/20 pb-1 hover:border-rose-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-rose-500/20">Manifest Soul</button>
                     </>
                   )}
                </div>
              </div>
            )}

            {screen === 'gym' && <GymPanel />}
            {screen === 'acts' && <SummonActsPanel />}
            {screen === 'quests' && <QuestLogPanel />}
          </div>
        </div>

        {/* Resource Bars Area (At bottom of middle) */}
        <div className="shrink-0">
          <ResourcePanel />
        </div>

        {/* Command Line */}
        <div className="h-16 bg-black border-t border-gray-900 flex items-center px-8 shrink-0 focus-within:bg-[#080808] transition-colors">
          <span className="text-emerald-500 font-black text-xl mr-4 select-none">›</span>
          <input
            type="text"
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-emerald-400 text-sm font-mono placeholder:text-gray-800 uppercase tracking-widest"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCommand(input.toLowerCase().trim());
                setInput('');
              }
            }}
            placeholder="Enter command (north, search, etc)..."
          />
        </div>
      </div>

      {/* RIGHT SIDEBAR: World Entities & Logs */}
      <div className="w-[340px] flex flex-col bg-[#080808] shrink-0">
        {/* Entities (Mobs / Items) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
           <div>
             <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">Nearby presences</div>
             <div className="space-y-3">
                {Array.from(new Set(nearbyNames)).slice(0, 5).map((name, i) => (
                  <div key={i} className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-2 h-2 bg-rose-500/40 rounded-full group-hover:bg-rose-500 transition-colors shadow-[0_0_8px_rgba(244,63,94,0.3)]"></div>
                    <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">{name.replace('Something stirs nearby... ', '')}</span>
                  </div>
                ))}
                {nearbyNames.length === 0 && <div className="text-[11px] text-gray-600 italic">No life detected</div>}
             </div>
           </div>

           <div className="border-t border-gray-900 pt-6">
             <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4 flex justify-between items-center">
               <span>Atlas Radar</span>
               <span className="text-[9px] font-mono opacity-50">{player.tileX}, {player.tileY}</span>
             </div>
             
             <div className="bg-black/40 p-3 rounded-2xl border border-gray-900 shadow-inner">
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const radius = 3;
                    const cells = [];
                    for (let dy = -radius; dy <= radius; dy++) {
                      for (let dx = -radius; dx <= radius; dx++) {
                        const tx = player.tileX + dx;
                        const ty = player.tileY + dy;
                        const key = getTileKey(tx, ty);
                        const t = world.tiles.get(key);
                        const isPlayer = dx === 0 && dy === 0;
                        
                        cells.push(
                          <div 
                            key={`${tx}-${ty}`}
                            className={`aspect-square rounded-sm transition-all duration-300 ${
                              isPlayer 
                                ? 'bg-white shadow-[0_0_5px_white] z-10 scale-110' 
                                : t?.discovered 
                                  ? getBiomeColor(t.biome) 
                                  : 'bg-gray-950/50 border border-gray-900/50'
                            } ${t?.explored ? 'ring-1 ring-emerald-500/20' : ''}`}
                            title={t?.discovered ? `${t.biome}${t.specialType ? ` - ${t.specialType}` : ''}` : 'Fog'}
                          >
                            {!isPlayer && t?.explored && t.specialType && (
                              <div className="w-full h-full flex items-center justify-center text-[6px]">
                                {t.specialType === 'city' ? '🏙️' : t.specialType === 'dungeon' ? '🏰' : '•'}
                              </div>
                            )}
                          </div>
                        );
                      }
                    }
                    return cells;
                  })()}
                </div>
                <div className="mt-3 flex justify-between items-center">
                   <span className="text-[8px] font-black text-emerald-500/60 uppercase">{tile?.biome || 'Unknown'}</span>
                   <button onClick={openWorldMap} className="text-[8px] font-black text-sky-500 uppercase hover:underline">Full Atlas »</button>
                </div>
             </div>
           </div>
        </div>

        {/* Global Log (Mini) */}
        <div className="h-[300px] border-t border-gray-900 flex flex-col bg-black/40">
          <div className="px-6 py-3 border-b border-gray-900 flex items-center justify-between">
             <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Communication</span>
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3 font-mono text-[11px]">
            {log.slice(-15).map((entry, i) => (
              <div key={i} className={`${entry.type === 'warning' ? 'text-amber-500/80' : entry.type === 'error' ? 'text-rose-500/80' : entry.type === 'success' ? 'text-emerald-500/80' : 'text-gray-500'}`}>
                <span className="mr-2 opacity-30 select-none">»</span>
                {entry.text}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      {/* Fullscreen Modals */}
      {['inventory', 'creatures', 'map', 'settings', 'combat', 'quests', 'dungeon', 'gym', 'acts', 'fusion', 'skills', 'stats', 'missions'].includes(screen) && (
        <div className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
          <div className="flex justify-between items-center px-8 py-6 border-b border-gray-900 bg-black/40">
            <div className="flex items-center gap-4">
              <span className="text-2xl">
                {screen === 'inventory' ? '🎒' : screen === 'creatures' ? '🎴' : screen === 'map' ? '📜' : screen === 'settings' ? '⚙️' : screen === 'combat' ? '⚔️' : screen === 'quests' ? '📜' : screen === 'gym' ? '⚔️' : screen === 'acts' ? '🔮' : screen === 'fusion' ? '🔮' : screen === 'skills' ? '✨' : screen === 'stats' ? '💪' : screen === 'missions' ? '📋' : '🏰'}
              </span>
              <div>
                <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">{screenName(screen)}</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Neural Link: Stable</p>
              </div>
            </div>
            <button 
              onClick={closeModal} 
              className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 transition-all group"
            >
              <span className="text-2xl group-hover:rotate-90 transition-transform duration-300">×</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 lg:p-12">
            <div className="max-w-7xl mx-auto h-full">
              {screen === 'inventory' && <InventoryPanel />}
              {screen === 'creatures' && <CreaturesPanel />}
              {screen === 'map' && <MapPanel />}
              {screen === 'settings' && <SettingsPanel />}
              {screen === 'combat' && <CombatPanel />}
              {screen === 'quests' && <QuestLogPanel />}
              {screen === 'dungeon' && <DungeonPanel />}
              {screen === 'gym' && <GymPanel />}
              {screen === 'acts' && <SummonActsPanel />}
              {screen === 'fusion' && <FusionPanel />}
{screen === 'skills' && <SkillTreePanel />}
               {screen === 'stats' && <StatAllocationPanel />}
               {screen === 'missions' && <MissionProgressPanel />}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const ARCHETYPES = [
  { id: 'fighter', name: 'Fighter', icon: '⚔️', desc: 'Close-combat specialist. High strength, tanky.' },
  { id: 'trader', name: 'Trader', icon: '💰', desc: 'Economic power. Better prices, more money.' },
  { id: 'explorer', name: 'Explorer', icon: '🗺️', desc: 'Speed & discovery. Fast travel, hidden areas.' },
  { id: 'spy', name: 'Spy', icon: '🕵️', desc: 'Stealth & info. Dodge, crits, intel.' },
  { id: 'assassin', name: 'Assassin', icon: '🗡️', desc: 'Burst damage. High crit, first strike.' },
  { id: 'summoner', name: 'Summoner', icon: '🎴', desc: 'Creature master. Better capture, bonding.' },
  { id: 'pvp', name: 'PvP Warrior', icon: '🏆', desc: 'Player combat. Arena bonuses, ranking.' },
  { id: 'pve', name: 'PvE Hunter', icon: '🎯', desc: 'Dungeon specialist. Boss damage, loot.' },
];

const StartScreen: React.FC = () => {
  const initGame = useGameStore((s) => s.initGame);
  const [name, setName] = useState('Seeker');
  const [archetype, setArchetype] = useState('fighter');

  return (
    <div className="h-screen w-screen bg-gray-950 text-gray-100 flex items-center justify-center font-mono relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(circle at 30% 40%, #6366f1 0%, transparent 50%), radial-gradient(circle at 70% 60%, #8b5cf6 0%, transparent 50%)' }} />
      <div className="border border-gray-700 bg-gray-900/95 p-6 rounded-lg max-w-2xl w-full shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">SUMMONERWORLD</h1>
          <p className="text-xs text-gray-500">Text RPG · Creature Collection · v0.4</p>
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

        <div className="mb-6">
          <label className="block text-sm text-gray-300 mb-3 font-semibold">Choose Archetype</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ARCHETYPES.map((arch) => (
              <button
                key={arch.id}
                onClick={() => setArchetype(arch.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  archetype === arch.id
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-gray-700 bg-gray-950 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-1">{arch.icon}</div>
                <div className="text-xs font-black uppercase tracking-widest">{arch.name}</div>
                <div className="text-[10px] text-gray-500 mt-1 leading-tight">{arch.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => initGame(name || 'Seeker', archetype)}
          className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white py-2.5 rounded font-semibold transition-all mb-2"
        >
          Begin Journey
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

function CreaturesPanel() {
  const player = useGameStore((s) => s.player);
  const selectCreatureForCombat = useGameStore((s) => s.selectCreatureForCombat);
  const combatTarget = useGameStore((s) => s.combatTarget);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!player) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter mb-1">Soul Deck</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Your bonded manifestations ({player.creatures.length}/6)</p>
        </div>
        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < player.creatures.length ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-800'}`}></div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {player.creatures.length === 0 && (
          <div className="col-span-full bg-gray-900/40 border border-dashed border-gray-800 rounded-3xl p-12 text-center">
            <span className="text-4xl mb-4 block opacity-20">🎴</span>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No bonded souls detected</p>
          </div>
        )}
        {player.creatures.map((c) => {
          const isExpanded = expandedId === c.id;
          const isActive = combatTarget === c.id;
          return (
            <div key={c.id} className={`relative overflow-hidden bg-gray-900/40 rounded-3xl border transition-all duration-300 group ${isActive ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-gray-800 hover:border-gray-700'}`}>
              {isActive && <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest rounded-bl-xl z-10">Primary</div>}
              
              <div className="p-6 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 block ${CLASS_COLORS[c.class || 'common']}`}>
                      {capitalizeClass(c.class || 'common')}
                    </span>
                    <h3 className="text-2xl font-black text-white italic tracking-tighter">{c.nickname || 'Unknown Soul'}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Level</span>
                    <span className="text-xl font-black text-white italic tracking-tighter leading-none">{c.level}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-500">
                      <span>Vitality</span>
                      <span>{c.currentHealth} / {c.maxHealth}</span>
                    </div>
                    <div className="w-full bg-gray-950 h-1.5 rounded-full overflow-hidden p-0.5">
                      <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${(c.currentHealth / (c.maxHealth || 100)) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-500">
                      <span>Energy</span>
                      <span>{c.currentMana} / {c.maxMana}</span>
                    </div>
                    <div className="w-full bg-gray-950 h-1.5 rounded-full overflow-hidden p-0.5">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(c.currentMana / (c.maxMana || 50)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-gray-800 grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="text-center">
                      <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest block mb-1">ATK</span>
                      <span className="text-lg font-black text-white italic leading-none">{c.attack || 0}</span>
                    </div>
                    <div className="text-center border-x border-gray-800">
                      <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest block mb-1">DEF</span>
                      <span className="text-lg font-black text-white italic leading-none">{c.defense || 0}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest block mb-1">SPD</span>
                      <span className="text-lg font-black text-white italic leading-none">{c.speed || 0}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex bg-black/40 border-t border-gray-800">
                <button 
                  onClick={() => selectCreatureForCombat(c.id)} 
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-emerald-500 hover:text-black ${isActive ? 'text-emerald-500 cursor-default' : 'text-gray-500'}`}
                  disabled={isActive}
                >
                  {isActive ? 'SYNCHRONIZED' : 'ESTABLISH LINK'}
                </button>
                <div className="w-px bg-gray-800"></div>
                <button className="px-4 text-gray-600 hover:text-white transition-colors">⚙️</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function InventoryPanel() {
  const player = useGameStore((s) => s.player);
  const useItem = useGameStore((s) => s.useItem);

  if (!player) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter mb-1">Satchel</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Inventory manifests ({player.inventory.length} items)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {player.inventory.length === 0 && (
          <div className="col-span-full bg-gray-900/40 border border-dashed border-gray-800 rounded-3xl p-12 text-center">
            <span className="text-4xl mb-4 block opacity-20">🎒</span>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No items collected</p>
          </div>
        )}
        {player.inventory.map((stack) => {
          const item = resolveItem(stack.templateKey);
          return (
            <div key={stack.templateKey} className="bg-gray-900/40 rounded-2xl border border-gray-800 p-4 hover:border-gray-700 transition-all group flex flex-col items-center text-center">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                {item.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-white tracking-tighter mb-1">{item.name}</h3>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-3">{item.rarityLabel || 'Common'}</span>
              </div>
              <div className="w-full mt-auto flex items-center justify-between gap-2 pt-4 border-t border-gray-800/50">
                <span className="bg-gray-950 px-2 py-1 rounded-md text-[10px] font-black text-gray-400">x{stack.quantity}</span>
                {item.type === 'consumable' && (
                  <button 
                    onClick={() => useItem(stack.templateKey)} 
                    className="flex-1 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-black border border-indigo-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest py-1.5 transition-all"
                  >
                    Consume
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function MapPanel() {
  const player = useGameStore((s) => s.player);
  const worlds = useGameStore((s) => s.worlds);
  const currentWorldId = useGameStore((s) => s.currentWorldId);
  if (!player || !worlds.has(currentWorldId)) return null;
  const world = worlds.get(currentWorldId)!;

  const viewSize = 15;
  const half = Math.floor(viewSize / 2);
  const cells: { x: number; y: number; biome: string; discovered: boolean; explored: boolean; specialType?: string; isPlayer: boolean }[] = [];
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      const tx = player.tileX + dx;
      const ty = player.tileY + dy;
      const key = getTileKey(tx, ty);
      let tile = world.tiles.get(key);
      
      // If not in memory but discovered, we'd need to re-generate it to show on map
      // For the radar, we only show what's in world.tiles (which stores everything seen)
      cells.push({
        x: dx + half,
        y: dy + half,
        biome: tile?.biome || 'forest',
        discovered: tile?.discovered || false,
        explored: tile?.explored || false,
        specialType: tile?.specialType,
        isPlayer: dx === 0 && dy === 0,
      });
    }
  }

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

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter mb-1 uppercase">Atlas</h2>
          <div className="flex items-center gap-4">
            <p className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">{world.name} — Sector {world.id}</p>
            <button 
              onClick={() => (useGameStore.getState() as any).createMapScroll()}
              className="px-3 py-1 bg-gray-900 hover:bg-emerald-600/20 text-emerald-400 border border-gray-800 hover:border-emerald-500/50 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
            >
              Transcribe Scroll
            </button>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest block mb-1">Grid Resolution</span>
          <span className="text-sm font-mono text-gray-400">{viewSize}x{viewSize} SENSORS</span>
        </div>
      </div>

      <div className="bg-black/60 rounded-[2.5rem] p-8 border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${viewSize}, 1fr)` }}>
          {cells.map((cell, idx) => {
            const color = cell.isPlayer 
              ? 'bg-white scale-110 z-10 shadow-[0_0_15px_rgba(255,255,255,0.8)]' 
              : cell.discovered 
                ? getBiomeColor(cell.biome) 
                : 'bg-gray-950 border border-gray-900';
            
            const isSpecial = cell.explored && cell.specialType;
            
            return (
              <div 
                key={idx} 
                className={`aspect-square rounded-xl transition-all duration-500 flex items-center justify-center text-[10px] ${color} ${!cell.discovered ? 'opacity-20' : ''}`} 
                title={cell.discovered ? `${cell.biome}${cell.specialType && cell.explored ? ` - ${cell.specialType}` : ''}` : 'Fog of war'} 
              >
                {isSpecial && <span className="drop-shadow-md">{getSpecialIcon(cell.specialType!)}</span>}
                {cell.isPlayer && <span className="text-black font-bold">@</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-6 opacity-60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]"></div>
          <span className="text-[9px] font-black uppercase tracking-widest text-white">You</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-800"></div>
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Biome</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">🏰</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Landmark (Explored)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-950 border border-gray-800"></div>
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Fog of War</span>
        </div>
      </div>
    </div>
  );
};

function DungeonPanel() {
  const dungeon = useGameStore((s) => s.dungeon);
  const player = useGameStore((s) => s.player);
  const combat = useGameStore((s) => s.combat);
  const enterDungeon = useGameStore((s) => s.enterDungeon);
  const descendDungeon = useGameStore((s) => s.descendDungeon);
  const fleeDungeon = useGameStore((s) => s.fleeDungeon);
  const closeModal = useGameStore((s) => s.closeModal);
  const resolveTrapRoom = useGameStore((s) => s.resolveTrapRoom);
  const resolvePuzzleRoom = useGameStore((s) => s.resolvePuzzleRoom);

  if (!player) return null;

  if (!dungeon.active) {
    return (
      <div className="bg-gray-900/40 backdrop-blur-2xl p-12 rounded-3xl border border-gray-800 text-center max-w-lg mx-auto shadow-2xl">
        <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.1)]">
          <span className="text-5xl">🏰</span>
        </div>
        <h2 className="text-4xl font-black text-white italic tracking-tighter mb-4 leading-tight">Ancient Spire</h2>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-8">
          Challenge the echoes of a fallen world. High risk. Infinite reward.
        </p>
        <div className="space-y-3">
          <button 
            onClick={enterDungeon} 
            className="w-full bg-rose-600 hover:bg-rose-500 text-black py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all transform active:scale-[0.98] shadow-[0_10px_20px_rgba(244,63,94,0.2)]"
          >
            Enter Anomaly
          </button>
          <button 
            onClick={closeModal} 
            className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const encounterIcon = dungeon.encounterType === 'trap' ? '⚠️' : dungeon.encounterType === 'treasure' ? '🎁' : dungeon.encounterType === 'boss' ? '💀' : '🪜';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-500 text-[10px] font-black uppercase rounded tracking-widest border border-rose-500/30 mb-2 inline-block">
            Floor {dungeon.currentFloor} / {dungeon.totalFloors}
          </span>
          <h2 className="text-4xl font-black text-white italic tracking-tighter">The Spire Core</h2>
        </div>
        <button onClick={fleeDungeon} className="text-[10px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest border-b border-rose-500/20 pb-1 transition-all">Extract Now</button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {combat.roomInteraction?.active && (combat.roomInteraction.roomType === 'trap' || combat.roomInteraction.roomType === 'puzzle') ? (
          <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-gray-950 rounded-2xl flex items-center justify-center border border-gray-800">
                <span className="text-3xl">{combat.roomInteraction.roomType === 'trap' ? '⚠️' : '🧩'}</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">
                  {combat.roomInteraction.roomType === 'trap' ? 'Hazard Encounter' : 'Puzzle Room'}
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                  {combat.roomInteraction.roomType === 'trap' ? 'Danger detected — choose your action carefully' : 'Logic challenge awaits — solve to proceed'}
                </p>
              </div>
            </div>

            <div className="bg-black/30 border border-gray-800 rounded-2xl p-6 mb-6">
              <p className="text-gray-300 font-serif italic leading-relaxed mb-4">{combat.roomInteraction.message}</p>
              {combat.roomInteraction.roomType === 'trap' && (
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Choose an evasion or defense maneuver:</p>
              )}
              {combat.roomInteraction.roomType === 'puzzle' && (
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Select your answer:</p>
              )}
            </div>

            {combat.roomInteraction.choices && !combat.roomInteraction.result && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {combat.roomInteraction.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => {
                      if (combat.roomInteraction?.roomType === 'trap') resolveTrapRoom(choice.id);
                      if (combat.roomInteraction?.roomType === 'puzzle') resolvePuzzleRoom(choice.id);
                    }}
                    className="bg-gray-950 hover:bg-emerald-600/20 text-emerald-400 border border-gray-800 hover:border-emerald-500/30 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all text-left px-4"
                  >
                    <div className="font-bold text-white mb-1">{choice.label}</div>
                    <div className="text-[9px] text-gray-500">{choice.description}</div>
                  </button>
                ))}
              </div>
            )}

            {combat.roomInteraction.result && (
              <div className={`mt-4 text-center p-4 rounded-2xl border ${combat.roomInteraction.result.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                <p className={`text-sm font-bold ${combat.roomInteraction.result.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {combat.roomInteraction.result.message}
                </p>
                {combat.roomInteraction.result.damageTaken && (
                  <p className="text-xs text-rose-500 mt-2 font-bold uppercase">Damage taken: {combat.roomInteraction.result.damageTaken}</p>
                )}
                <button
                  onClick={descendDungeon}
                  className="mt-4 bg-gray-950 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 py-3 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  Continue Descent
                </button>
              </div>
            )}
          </div>
        ) : combat.active ? (
          <div className="bg-rose-950/20 border border-rose-500/30 p-8 rounded-3xl text-center animate-pulse">
            <span className="text-4xl mb-4 block">⚔️</span>
            <p className="text-rose-400 font-black uppercase tracking-widest text-sm">Combat Interface Synchronizing...</p>
          </div>
        ) : (
          <div className="bg-gray-900/40 p-8 rounded-3xl border border-gray-800">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-gray-950 rounded-2xl flex items-center justify-center border border-gray-800">
                <span className="text-3xl">{encounterIcon}</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">
                  {dungeon.encounterType === 'boss' ? 'Guardian Chamber' : dungeon.encounterType === 'trap' ? 'Hazard Zone' : dungeon.encounterType === 'treasure' ? 'Vault Chamber' : 'Descent Corridor'}
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                  {dungeon.clearedFloors.includes(dungeon.currentFloor) ? 'Floor Cleared' : dungeon.encounterType === 'trap' ? 'Danger detected!' : dungeon.encounterType === 'treasure' ? 'Spoils await' : 'Unknown Entity Detected'}
                </p>
              </div>
            </div>
            
            <button 
              onClick={descendDungeon} 
              className="w-full bg-gray-950 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all"
            >
              {dungeon.currentFloor === dungeon.totalFloors ? 'Engage Guardian' : dungeon.encounterType === 'trap' ? 'Proceed Carefully' : dungeon.encounterType === 'treasure' ? 'Open Chest' : 'Proceed to next Depth'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPanel() {
  const player = useGameStore((s) => s.player);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const closeModal = useGameStore((s) => s.closeModal);

  if (!player) return null;

  const renderSlider = (label: string, value: number, min: number, max: number, onChange: (v: number) => void) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</label>
        <span className="text-xs font-mono text-emerald-400">{value}</span>
      </div>
      <input 
        type="range" min={min} max={max} value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))} 
        className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
      />
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-gray-900/40 backdrop-blur-2xl p-10 rounded-3xl border border-gray-800 shadow-2xl">
      <h2 className="text-3xl font-black text-white italic tracking-tighter mb-8 text-center uppercase">System Config</h2>
      
      <div className="space-y-8">
        {renderSlider('Interface Speed', player.settings.textSpeed || 30, 0, 200, (v) => updateSettings({ textSpeed: v }))}
        {renderSlider('Matrix Font Size', player.settings.fontSize || 15, 12, 24, (v) => updateSettings({ fontSize: v }))}
        
        <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-gray-800">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">High Contrast Filter</span>
          <button 
            onClick={() => updateSettings({ highContrast: !player.settings.highContrast })} 
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${player.settings.highContrast ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-gray-800 text-gray-500'}`}
          >
            {player.settings.highContrast ? 'Active' : 'Disabled'}
          </button>
        </div>
      </div>
      
      <button 
        onClick={closeModal} 
        className="w-full mt-10 bg-gray-950 hover:bg-gray-800 text-gray-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-gray-800 transition-all"
      >
        Save & Return
      </button>
    </div>
  );
};

function CombatPanel() {
  const combat = useGameStore((s) => s.combat);
  const player = useGameStore((s) => s.player);
  const useSkillAction = useGameStore((s) => s.useSkill);
  const fleeCombat = useGameStore((s) => s.fleeCombat);
  const useItemAction = useGameStore((s) => s.useItem);
  const scanEnemy = useGameStore((s) => s.scanEnemy);
  const guessWeakness = useGameStore((s) => s.guessWeakness);
  const closeModal = useGameStore((s) => s.closeModal);

  if (!combat.active) {
    return (
      <div className="bg-gray-900/40 p-12 rounded-3xl border border-gray-800 text-center max-w-md mx-auto">
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-6">Combat Link Terminated</p>
        <button onClick={closeModal} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all">Return to Exploration</button>
      </div>
    );
  }

  const activeCreature = player?.creatures.find(c => c.id === combat.playerCreatureId) || player?.creatures[0];
  const combatSkills = activeCreature?.skills?.map(s => typeof s === 'string' ? s : 'strike') || [];

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Enemy Side */}
      <div className="space-y-6">
        <div className="bg-rose-950/20 border border-rose-500/30 p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <span className="text-6xl text-rose-500">💀</span>
          </div>
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-1">Hostile Entity Detected</span>
          <h2 className="text-4xl font-black text-white italic tracking-tighter mb-6">{combat.enemyName || 'Manifestation'}</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
              <span>Threat Integrity</span>
              <span>{Math.floor(combat.enemyHp || 0)} / {combat.enemyMaxHp || 0}</span>
            </div>
            <div className="w-full bg-black/60 h-3 rounded-full overflow-hidden p-[2px] border border-gray-800">
               <div className="h-full bg-rose-500 rounded-full transition-all duration-700" style={{ width: `${((combat.enemyHp || 0) / (combat.enemyMaxHp || 1)) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Combat Log */}
        <div className="bg-black/40 border border-gray-800 rounded-3xl p-6 h-64 overflow-y-auto font-mono text-xs space-y-3 shadow-inner">
          {combat.log.map((entry, idx) => (
            <div key={idx} className={`flex gap-3 ${idx === combat.log.length - 1 ? 'text-white font-bold' : 'text-gray-500'}`}>
              <span className="opacity-30">[{idx}]</span>
              <span>{entry}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Player Side */}
      <div className="space-y-6">
        {activeCreature && (
          <div className="bg-indigo-950/20 border border-indigo-500/30 p-8 rounded-3xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <span className="text-6xl text-indigo-500">🧿</span>
            </div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">Soul Link Active</span>
            <h2 className="text-4xl font-black text-white italic tracking-tighter mb-6">{activeCreature.nickname || 'Bonded Soul'}</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                <span>Vitality Status</span>
                <span>{activeCreature.currentHealth} / {activeCreature.maxHealth}</span>
              </div>
              <div className="w-full bg-black/60 h-3 rounded-full overflow-hidden p-[2px] border border-gray-800">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(activeCreature.currentHealth / (activeCreature.maxHealth || 100)) * 100}%` }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8 space-y-6">
          {!combat.playerCreatureId && combat.phase === 'player_turn' && (
            <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl text-center text-amber-400 text-xs font-bold uppercase tracking-widest animate-pulse">
              ⚠️ Your active summon has fainted! You must select another healthy summon from below to continue!
            </div>
          )}

          {combat.phase === 'player_turn' && (
            <>
              {combat.isBoss && !combat.scanResult && (
                <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-2">Boss Analysis Module</span>
                  <button 
                    onClick={() => scanEnemy()} 
                    className="w-full bg-amber-950/40 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                  >
                    🔍 Scan Enemy Composition
                  </button>
                </div>
              )}

              {combat.scanResult && (
                <div className="bg-indigo-950/20 border border-indigo-500/30 p-4 rounded-xl">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Scanned Intel — Weaknesses & Resistances</span>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-400 uppercase">
                      Weaknesses: {combat.scanResult.weaknesses.length > 0 ? combat.scanResult.weaknesses.join(', ') : 'None'}
                    </span>
                    <span className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded text-[9px] font-black text-rose-400 uppercase">
                      Resistances: {combat.scanResult.resistances.length > 0 ? combat.scanResult.resistances.join(', ') : 'None'}
                    </span>
                  </div>
                  {combat.scanResult.guessCorrect === undefined && (
                    <div>
                      <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block mb-2">Guess Primary Weakness</span>
                      <div className="grid grid-cols-3 gap-2">
                        {combat.scanResult.weaknesses.length > 0 ? combat.scanResult.weaknesses.map((w) => (
                          <button 
                            key={w} 
                            onClick={() => guessWeakness(w)} 
                            className="py-2 bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            {w.replace(/_/g, ' ')}
                          </button>
                        )) : (
                          <span className="text-[9px] text-gray-500 col-span-3">No weaknesses detected.</span>
                        )}
                      </div>
                    </div>
                  )}
                  {combat.scanResult.guessCorrect === true && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 animate-pulse">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">🔍 Weakness Identified</span>
                      <span className="text-[9px] text-emerald-300 uppercase tracking-widest block mt-1">
                        {combat.scanResult.guessedElement ? `${combat.scanResult.guessedElement.replace(/_/g, ' ')} is the primary weakness — Damage amplified +30%` : 'Correct guess active — Damage amplified +30%'}
                      </span>
                    </div>
                  )}
                  {combat.scanResult.guessCorrect === false && (
                    <div className={`rounded-lg p-3 ${combat.scanResult.penaltyTurnsRemaining && combat.scanResult.penaltyTurnsRemaining > 0 ? 'bg-rose-500/10 border border-rose-500/30 animate-pulse' : 'bg-gray-500/10 border border-gray-500/30'}`}>
                      <span className={`text-[10px] font-black uppercase tracking-widest block ${combat.scanResult.penaltyTurnsRemaining && combat.scanResult.penaltyTurnsRemaining > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                        {combat.scanResult.penaltyTurnsRemaining && combat.scanResult.penaltyTurnsRemaining > 0
                          ? `❌ Wrong guess — Damage penalized -70% (${combat.scanResult.penaltyTurnsRemaining} turns remaining)`
                          : '❌ Wrong guess penalty expired'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {combat.playerCreatureId && (
                <div className="grid grid-cols-2 gap-3">
                  {combatSkills.slice(0, 4).map((skill) => (
                    <button 
                      key={skill} 
                      onClick={() => useSkillAction(skill)} 
                      className="bg-gray-950 hover:bg-emerald-600/20 text-emerald-400 border border-gray-800 hover:border-emerald-500/30 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                    >
                      {skill.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              )}

              {/* Send / Switch Summon Section */}
              <div className="border-t border-gray-800/80 pt-4 space-y-3">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Send Summon to Battle (Soul Deck)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {player?.creatures.map((c) => {
                    const isCurrent = c.id === combat.playerCreatureId;
                    const isFainted = c.currentHealth <= 0;
                    
                    return (
                      <button
                        key={c.id}
                        disabled={isCurrent || isFainted}
                        onClick={() => {
                          const switchCreatureInCombat = (useGameStore.getState() as any).switchCreatureInCombat;
                          if (switchCreatureInCombat) switchCreatureInCombat(c.id);
                        }}
                        className={`px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest flex justify-between items-center transition-all ${
                          isCurrent 
                            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500/60 cursor-default' 
                            : isFainted 
                              ? 'border-rose-950/20 bg-rose-950/5 text-rose-500/40 cursor-not-allowed'
                              : 'border-gray-800 hover:border-indigo-500 hover:bg-indigo-500/10 text-indigo-400'
                        }`}
                      >
                        <span className="truncate max-w-[120px]">{c.nickname || 'Unknown'}</span>
                        <span className="font-mono text-[9px] opacity-80">
                          {isCurrent ? 'Fighting' : isFainted ? 'Fainted' : `HP ${c.currentHealth}/${c.maxHealth}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {combat.playerCreatureId && (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => useItemAction('healing_herb')} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-indigo-400 border border-indigo-500/20 rounded-2xl hover:bg-indigo-500/10 transition-all">Consumable</button>
                  <button onClick={fleeCombat} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 border border-gray-800 rounded-2xl hover:bg-gray-800 transition-all">Withdraw</button>
                </div>
              )}
            </>
          )}

          {combat.roomInteraction?.active && !combat.active && (
             <div className="max-w-4xl mx-auto space-y-6">
               <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8">
                 <h3 className="text-2xl font-black text-white italic tracking-tighter mb-4">
                   {combat.roomInteraction.roomType === 'trap' ? 'Hazard Encounter' : 
                    combat.roomInteraction.roomType === 'puzzle' ? 'Puzzle Room' : 
                    combat.roomInteraction.roomType === 'vendor' ? 'Merchant Encounter' : 
                    combat.roomInteraction.roomType === 'treasure' ? 'Treasure Chamber' : 
                    'Special Room'}
                 </h3>
                 <p className="text-gray-400 mb-6 font-serif italic">{combat.roomInteraction.message}</p>
                 
                 {combat.roomInteraction.choices && (
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                     {combat.roomInteraction.choices.map((choice) => (
                       <button
                         key={choice.id}
                         onClick={() => {
                           const resolveAction = (useGameStore.getState() as any)[`resolve${capitalize(combat.roomInteraction!.roomType)}Room`];
                           if (resolveAction) resolveAction(choice.id);
                         }}
                         className="bg-gray-950 hover:bg-emerald-600/20 text-emerald-400 border border-gray-800 hover:border-emerald-500/30 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all text-left px-4"
                       >
                         <div className="font-bold text-white mb-1">{choice.label}</div>
                         <div className="text-[9px] text-gray-500">{choice.description}</div>
                       </button>
                     ))}
                   </div>
                 )}
                 
                 {combat.roomInteraction.vendorData && !combat.roomInteraction.choices && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                     {combat.roomInteraction.vendorData.items.map((item) => (
                       <button
                         key={item.key}
                         onClick={() => {
                           const resolveVendorRoom = (useGameStore.getState() as any).resolveVendorRoom;
                           if (resolveVendorRoom) resolveVendorRoom(item.key);
                         }}
                         disabled={item.stock <= 0}
                         className="bg-gray-950 hover:bg-emerald-600/20 text-emerald-400 border border-gray-800 hover:border-emerald-500/30 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all text-left px-3 disabled:opacity-30 disabled:cursor-not-allowed"
                       >
                         <div className="font-bold text-white">{item.name} <span className="text-gray-500 font-normal">({item.price} stones)</span></div>
                         <div className="text-[8px] text-gray-500">Stock: {item.stock}</div>
                       </button>
                     ))}
                   </div>
                 )}
                 
                 {combat.roomInteraction.treasureData && !combat.roomInteraction.choices && (
                   <div className="text-center">
                     <button
                       onClick={() => {
                         const resolveTreasureRoom = (useGameStore.getState() as any).resolveTreasureRoom;
                         if (resolveTreasureRoom) resolveTreasureRoom();
                       }}
                       className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black py-4 px-8 rounded-2xl font-black uppercase tracking-[0.2em] transition-all transform active:scale-[0.98]"
                     >
                       {combat.roomInteraction.treasureData.hasMythicalEgg ? 'Claim Mythical Egg!' : 'Collect Treasure'}
                     </button>
                     {combat.roomInteraction.treasureData.hasMythicalEgg && (
                       <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest mt-3 animate-pulse">★ Rare Drop Detected! ★</p>
                     )}
                   </div>
                 )}
                 
                 {combat.roomInteraction.result && (
                   <div className="mt-4 text-center">
                     <p className={`text-sm font-bold ${combat.roomInteraction.result.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                       {combat.roomInteraction.result.message}
                     </p>
                   </div>
                 )}
               </div>
             </div>
           )}

           {(combat.phase === 'victory' || combat.phase === 'defeat') && (
            <div className="text-center space-y-6 py-4 animate-in zoom-in duration-500">
              <h3 className={`text-5xl font-black italic tracking-tighter uppercase ${combat.phase === 'victory' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {combat.phase === 'victory' ? 'Victory' : 'Defeat'}
              </h3>
              <button onClick={closeModal} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl">Close Interface</button>
            </div>
          )}

          {combat.phase === 'enemy_turn' && (
            <div className="text-center py-10">
              <div className="inline-block w-8 h-8 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mb-4"></div>
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest animate-pulse">Processing Hostile Intent...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HeaderBar: React.FC<{ worldName: string; worldId: number; turn: number; time: string }> = ({ worldName, worldId, turn, time }) => (
  <div className="bg-gray-900 border-b border-gray-700 px-4 py-1.5 flex justify-between items-center text-xs shadow-md">
    <div className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 tracking-wider">SUMMONERWORLD</div>
    <div className="text-gray-300">
      {worldName} · Turn {turn} · {time}
    </div>
    <div className="text-gray-600">v0.3</div>
  </div>
);

function logColor(type: string): string {
  switch (type) {
    case 'success': return 'text-green-400';
    case 'warning': return 'text-yellow-400';
    case 'error': return 'text-red-400';
    case 'combat': return 'text-orange-400';
    case 'system': return 'text-blue-400';
    default: return 'text-gray-300';
  }
}

function screenName(s: Screen): string {
  switch (s) {
    case 'creatures': return 'Creatures';
    case 'inventory': return 'Inventory';
    case 'map': return 'World Map';
    case 'dungeon': return 'Dungeon';
    case 'settings': return 'Settings';
    case 'combat': return 'Combat';
    case 'quests': return 'Quests';
    case 'gym': return 'Combat Dojo';
    case 'acts': return 'Soul Rituals';
    case 'fusion': return 'Soul Forge';
    case 'skills': return 'Skill Tree';
    case 'stats': return 'Character Stats';
    case 'missions': return 'Mission Queue';
    default: return s;
  }
}

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

function capitalizeClass(cls: string): string {
  return cls.charAt(0).toUpperCase() + cls.slice(1);
}

function resolveItem(key: string): { name: string; icon: string; rarityLabel: string; type: string; rarity: number } {
  const resources: Record<string, { name: string; icon: string; rarityLabel: string; type: string; rarity: number }> = {
    wood: { name: 'Wood', icon: '🪵', rarityLabel: 'Common Material', type: 'material', rarity: 1 },
    stone: { name: 'Stone', icon: '🪨', rarityLabel: 'Common Material', type: 'material', rarity: 1 },
    ore: { name: 'Ore', icon: '⛏️', rarityLabel: 'Common Material', type: 'material', rarity: 1 },
    herbs: { name: 'Herbs', icon: '🌿', rarityLabel: 'Common Material', type: 'material', rarity: 1 },
    crystal: { name: 'Crystal', icon: '💎', rarityLabel: 'Rare Material', type: 'material', rarity: 3 },
    essence: { name: 'Essence', icon: '✨', rarityLabel: 'Rare Material', type: 'material', rarity: 3 },
    healing_herb: { name: 'Healing Herb', icon: '🍃', rarityLabel: 'Common Consumable', type: 'consumable', rarity: 1 },
    mana_crystal: { name: 'Mana Crystal', icon: '🔷', rarityLabel: 'Uncommon Consumable', type: 'consumable', rarity: 2 },
    resource_shard: { name: 'Essence Shard', icon: '💠', rarityLabel: 'Common Material', type: 'material', rarity: 1 },
    fire_herb: { name: 'Fire Herb', icon: '🔥', rarityLabel: 'Uncommon', type: 'consumable', rarity: 2 },
    water_herb: { name: 'Water Herb', icon: '💧', rarityLabel: 'Uncommon', type: 'consumable', rarity: 2 },
    soul_crystal_common: { name: 'Soul Crystal (Common)', icon: '🔮', rarityLabel: 'Common', type: 'special', rarity: 1 },
    soul_crystal_uncommon: { name: 'Soul Crystal (Uncommon)', icon: '🔮', rarityLabel: 'Uncommon', type: 'special', rarity: 2 },
    soul_crystal_rare: { name: 'Soul Crystal (Rare)', icon: '🔮', rarityLabel: 'Rare', type: 'special', rarity: 3 },
    soul_crystal_epic: { name: 'Soul Crystal (Epic)', icon: '🔮', rarityLabel: 'Epic', type: 'special', rarity: 4 },
    soul_crystal_legendary: { name: 'Soul Crystal (Legendary)', icon: '🔮', rarityLabel: 'Legendary', type: 'special', rarity: 5 },
    soul_crystal_mythical: { name: 'Soul Crystal (Mythical)', icon: '🔮', rarityLabel: 'Mythical', type: 'special', rarity: 6 },
    capture_orb: { name: 'Capture Orb', icon: '⚪', rarityLabel: 'Common', type: 'special', rarity: 1 },
    basic_food: { name: 'Travel Rations', icon: '🍞', rarityLabel: 'Common', type: 'consumable', rarity: 1 },
    elemental_essence: { name: 'Elemental Essence', icon: '✨', rarityLabel: 'Rare', type: 'material', rarity: 3 },
    scroll_lightning: { name: 'Scroll of Lightning', icon: '⚡', rarityLabel: 'Rare', type: 'special', rarity: 3 },
    scroll_ice: { name: 'Scroll of Ice', icon: '❄️', rarityLabel: 'Rare', type: 'special', rarity: 3 },
    scroll_air: { name: 'Scroll of Air', icon: '💨', rarityLabel: 'Rare', type: 'special', rarity: 3 },
    scroll_earth: { name: 'Scroll of Earth', icon: '🪨', rarityLabel: 'Rare', type: 'special', rarity: 3 },
    scroll_fire: { name: 'Scroll of Fire', icon: '🔥', rarityLabel: 'Rare', type: 'special', rarity: 3 },
    scroll_water: { name: 'Scroll of Water', icon: '💧', rarityLabel: 'Rare', type: 'special', rarity: 3 },
    scroll_nature: { name: 'Scroll of Nature', icon: '🌿', rarityLabel: 'Rare', type: 'special', rarity: 3 },
    scroll_light: { name: 'Scroll of Light', icon: '☀️', rarityLabel: 'Rare', type: 'special', rarity: 3 },
    scroll_darkness: { name: 'Scroll of Darkness', icon: '🌙', rarityLabel: 'Rare', type: 'special', rarity: 3 },
    scroll_iron: { name: 'Scroll of Iron', icon: '⛓️', rarityLabel: 'Rare', type: 'special', rarity: 3 },
    scroll_starlight: { name: 'Scroll of Starlight', icon: '🌌', rarityLabel: 'Epic', type: 'special', rarity: 4 },
    scroll_void: { name: 'Scroll of Void', icon: '🕳️', rarityLabel: 'Epic', type: 'special', rarity: 4 },
    scroll_chaos: { name: 'Scroll of Chaos', icon: '🌀', rarityLabel: 'Epic', type: 'special', rarity: 4 },
  };
  return resources[key] || { name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), icon: '📦', rarityLabel: 'Unknown', type: 'material', rarity: 1 };
}
