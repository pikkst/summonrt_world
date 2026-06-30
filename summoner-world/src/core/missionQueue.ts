import type { CreatureInstance, InventoryStack, MissionResult, Element } from '../types/game';
import { SeededRandom } from '../utils/SeededRandom';
import { calculateEncounterXP, getWorldModifier } from '../core/xpCurve';

export type { CreatureInstance } from '../types/game';

export type MissionType =
  | 'EXPLORE_TIER_1'
  | 'SCOUT_DUNGEON'
  | 'SMELT_ORE'
  | 'CRAFT_ITEM'
  | 'STORE_VISIT'
  | 'TAX_EDICT'
  | 'CARAVAN_ROUTE'
  | 'SEARCH_AREA'
  | 'GATHER_RESOURCE'
  | 'CAPTURE_CREATURE'
  | 'DEMONLORD_ENCOUNTER'
  | 'WILD_ENCOUNTER';

export type MissionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface MissionModifiers {
  speed_multiplier?: number;
  caravan_speed_pct?: number;
  yield_bonus_pct?: number;
  tree_speed_pct?: number;
  creature_agility_mod?: number;
  resource_type?: string;
  encounter_data?: string;
  [key: string]: number | string | undefined;
}

export interface ActiveMission {
   mission_id: string;
   type: MissionType;
   assigned_creatures: string[];
   world_layer: number;
   start_time: number;
   duration_seconds: number;
   end_time: number;
   status: MissionStatus;
   modifiers: MissionModifiers;
}

export function createActiveMission(params: {
  type: MissionType;
  assigned_creatures: string[];
  world_layer: number;
  duration_seconds: number;
  modifiers?: MissionModifiers;
}): ActiveMission {
  const now = Date.now();
  const modifiers = params.modifiers ?? {};
  const treeSpeedMod = modifiers.tree_speed_pct ?? 0;
  const creatureAgilityMod = modifiers.creature_agility_mod ?? 0;
  const compressedDuration = calculateCompressedDuration(params.duration_seconds, treeSpeedMod, creatureAgilityMod);
  return {
    mission_id: `mission_${now}_${Math.random().toString(36).slice(2, 8)}`,
    type: params.type,
    assigned_creatures: params.assigned_creatures,
    world_layer: params.world_layer,
    start_time: now,
    duration_seconds: compressedDuration,
    end_time: now + compressedDuration * 1000,
    status: 'PENDING',
    modifiers: { ...modifiers },
  };
}

export function isMissionExpired(mission: ActiveMission, currentTime: number = Date.now()): boolean {
  return currentTime >= mission.end_time;
}

export function getRemainingSeconds(mission: ActiveMission, currentTime: number = Date.now()): number {
  return Math.max(0, Math.ceil((mission.end_time - currentTime) / 1000));
}

export function calculateCompressedDuration(
  baseDuration: number,
  treeSpeedMod: number,
  creatureAgilityMod: number
): number {
  const totalModifier = treeSpeedMod + creatureAgilityMod;
  const reductionFraction = Math.min(0.9, totalModifier / 100);
  return Math.max(60, baseDuration * (1 - reductionFraction));
}

export function getCreatureAgilityMod(creatures: CreatureInstance[]): number {
  if (creatures.length === 0) return 0;
  const avgSpeed = creatures.reduce((sum, c) => sum + (c.speed || 0), 0) / creatures.length;
  return Math.round(avgSpeed);
}

const ELEMENTAL_ADVANTAGES: Record<string, string[]> = {
  fire: ['nature', 'ice', 'iron'],
  water: ['fire', 'earth'],
  earth: ['lightning', 'iron'],
  air: ['earth', 'nature'],
  lightning: ['water', 'air'],
  nature: ['water', 'earth'],
  ice: ['nature', 'air'],
  light: ['darkness', 'void'],
  darkness: ['light', 'starlight'],
};

const ELEMENTAL_DISADVANTAGES: Record<string, string[]> = {
  fire: ['water', 'fire'],
  water: ['water', 'nature'],
  earth: ['air', 'nature'],
  air: ['iron'],
  lightning: ['earth', 'lightning'],
  nature: ['fire', 'nature'],
  ice: ['fire', 'water'],
  light: ['light'],
  darkness: ['darkness'],
};

function getElementalFactor(atkElement: string | undefined, defElements: string[] | undefined): number {
  if (!atkElement || !defElements || defElements.length === 0) return 1;
  let factor = 1;
  if (ELEMENTAL_ADVANTAGES[atkElement]?.some(e => defElements.includes(e))) factor = 1.5;
  else if (ELEMENTAL_DISADVANTAGES[atkElement]?.some(e => defElements.includes(e))) factor = 0.5;
  return factor;
}

export interface CombatTeamMember {
  creature: CreatureInstance;
  isAlive: boolean;
}

export interface AutomatedCombatOutcome {
  result: MissionResult;
  teamA: CombatTeamMember[];
  teamB: CombatTeamMember[];
}

export interface AutomatedCombatOutcome {
  result: MissionResult;
  teamA: CombatTeamMember[];
  teamB: CombatTeamMember[];
}

export function resolveAutomatedCombat(
  teamA: CreatureInstance[],
  teamB: CreatureInstance[],
  options?: { rngSeed?: number; worldLayer?: number; atkElements?: Element[]; primordialPct?: number; omniPct?: number }
): AutomatedCombatOutcome {
  const log: string[] = [];
  const rewards: InventoryStack[] = [];
  let totalXp = 0;

  const aliveTeamA: CombatTeamMember[] = teamA.map(c => ({ creature: { ...c }, isAlive: true }));
  const aliveTeamB: CombatTeamMember[] = teamB.map(c => ({ creature: { ...c }, isAlive: true }));

  const rng = options?.rngSeed !== undefined ? new SeededRandom(options.rngSeed) : null;

  function random(): number {
    return rng ? rng.next() : Math.random();
  }

  function pick<T>(arr: T[]): T | undefined {
    return arr[Math.floor(random() * arr.length)];
  }

  log.push('=== Automated Combat Initiated ===');
  log.push(`Your team: ${aliveTeamA.map(m => m.creature.nickname || 'Creature').join(', ')}`);
  log.push(`Opponent team: ${aliveTeamB.map(m => m.creature.nickname || 'Enemy').join(', ')}`);

  let turn = 0;
  const MAX_TURNS = 30;

  while (turn < MAX_TURNS) {
    const aAlive = aliveTeamA.filter(m => m.isAlive);
    const bAlive = aliveTeamB.filter(m => m.isAlive);

    if (aAlive.length === 0 || bAlive.length === 0) break;

    turn++;
    log.push(`\n--- Turn ${turn} ---`);

for (const atkr of aAlive) {
        const target = pick(bAlive)!;
        if (!target.isAlive) continue;

const atkElem = atkr.creature.elements?.[0];
       const defElems = target.creature.elements;
       const eff = getElementalFactor(atkElem, defElems);
       const primordialMult = (atkElem && options?.primordialPct) ? 1 + (options.primordialPct / 100) : 1;
       const omniMult = (atkElem && options?.omniPct) ? 1 + (options.omniPct / 100) : 1;

       const dmg = Math.max(1, Math.floor((atkr.creature.attack - target.creature.defense * 0.5) * eff * primordialMult * omniMult + Math.floor(random() * 5) - 2));
      target.creature.currentHealth = Math.max(0, target.creature.currentHealth - dmg);

      if (target.creature.currentHealth <= 0) {
        target.isAlive = false;
        const worldModifier = options?.worldLayer ? getWorldModifier(options.worldLayer) : 1;
        const atkElement = options?.atkElements?.[0] || atkr.creature.elements?.[0];
        const xpGain = calculateEncounterXP(
          target.creature.baseExpValue || 20,
          target.creature.level,
          worldModifier,
          atkElement,
          target.creature.elements
        );
        totalXp += xpGain;
        log.push(`${atkr.creature.nickname || 'Your creature'} defeated ${target.creature.nickname || 'Enemy'}! (+${xpGain} XP)`);
      } else {
        log.push(`${atkr.creature.nickname || 'Your creature'} hit ${target.creature.nickname || 'Enemy'} for ${dmg} damage.`);
      }
    }

    for (const atkr of bAlive) {
      if (!atkr.isAlive) continue;

      const targets = aAlive.filter(m => m.isAlive);
      if (targets.length === 0) continue;

const target = pick(targets)!;

       const atkElem = atkr.creature.elements?.[0];
      const defElems = target.creature.elements;
      const eff = getElementalFactor(atkElem, defElems);

      const dmg = Math.max(1, Math.floor((atkr.creature.attack - target.creature.defense * 0.5) * eff + Math.floor(random() * 5) - 2));
      target.creature.currentHealth = Math.max(0, target.creature.currentHealth - dmg);

      if (target.creature.currentHealth <= 0) {
        target.isAlive = false;
        log.push(`${atkr.creature.nickname || 'Enemy'} defeated ${target.creature.nickname || 'Your creature'}!`);
      } else {
        log.push(`${atkr.creature.nickname || 'Enemy'} hit ${target.creature.nickname || 'Your creature'} for ${dmg} damage.`);
      }
    }
  }

  const aSurvivors = aliveTeamA.filter(m => m.isAlive).length;
  const victory = aSurvivors > 0;

  if (victory && aSurvivors === aliveTeamA.length) {
    log.push('\n*** Your team achieved total victory! All enemies defeated. ***');
  } else if (victory) {
    log.push(`\n*** Your team won, but ${aliveTeamA.length - aSurvivors} creature(s) were defeated. ***`);
  } else {
    log.push('\n*** Your team was defeated. ***');
  }

  if (totalXp > 0 && random() < 0.3) {
    rewards.push({ templateKey: 'resource_shard', quantity: 1 });
    log.push('Loot found: 1x Essence Shard!');
  }

  return {
    result: {
      victory,
      battle_log: log,
      rewards,
      xp: totalXp,
    },
    teamA: aliveTeamA,
    teamB: aliveTeamB,
  };
}