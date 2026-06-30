import type { Element, DungeonEnvironmentalHazard } from '../../types/game';

const hazardByElement: Record<Element, DungeonEnvironmentalHazard> = {
  fire: {
    key: 'lava_burst',
    name: 'Lava Burst',
    element: 'fire',
    description: 'Molten vents erupt around the boss arena.',
    damageMultiplier: 1.15,
    triggerRate: 0.18
  },
  water: {
    key: 'tidal_surge',
    name: 'Tidal Surge',
    element: 'water',
    description: 'Rising water pressure pushes combatants across the arena.',
    damageMultiplier: 1.1,
    triggerRate: 0.16
  },
  earth: {
    key: 'seismic_fracture',
    name: 'Seismic Fracture',
    element: 'earth',
    description: 'The floor cracks and punishes slow positioning.',
    damageMultiplier: 1.12,
    triggerRate: 0.15
  },
  air: {
    key: 'cyclone_crosswind',
    name: 'Cyclone Crosswind',
    element: 'air',
    description: 'Violent crosswinds disrupt creature commands.',
    damageMultiplier: 1.08,
    triggerRate: 0.2
  },
  lightning: {
    key: 'storm_pulse',
    name: 'Storm Pulse',
    element: 'lightning',
    description: 'Arc flashes chain through exposed arena lanes.',
    damageMultiplier: 1.18,
    triggerRate: 0.17
  },
  iron: {
    key: 'magnetic_crush',
    name: 'Magnetic Crush',
    element: 'iron',
    description: 'Iron plates slam together and punish armored targets.',
    damageMultiplier: 1.14,
    triggerRate: 0.14
  },
  nature: {
    key: 'thorn_overgrowth',
    name: 'Thorn Overgrowth',
    element: 'nature',
    description: 'Living roots spread into temporary hazard zones.',
    damageMultiplier: 1.09,
    triggerRate: 0.19
  },
  ice: {
    key: 'frost_spikes',
    name: 'Frost Spikes',
    element: 'ice',
    description: 'Jagged ice blooms under weakened creatures.',
    damageMultiplier: 1.13,
    triggerRate: 0.16
  },
  light: {
    key: 'radiant_judgment',
    name: 'Radiant Judgment',
    element: 'light',
    description: 'Focused beams mark unsafe arena quadrants.',
    damageMultiplier: 1.11,
    triggerRate: 0.15
  },
  darkness: {
    key: 'umbral_zone',
    name: 'Umbral Zone',
    element: 'darkness',
    description: 'Dark zones obscure weakness reads and punish hesitation.',
    damageMultiplier: 1.16,
    triggerRate: 0.16
  },
  void: {
    key: 'void_collapse',
    name: 'Void Collapse',
    element: 'void',
    description: 'Unstable void pockets collapse inside the arena.',
    damageMultiplier: 1.2,
    triggerRate: 0.12
  },
  starlight: {
    key: 'stellar_rain',
    name: 'Stellar Rain',
    element: 'starlight',
    description: 'Starlight fragments fall in rotating patterns.',
    damageMultiplier: 1.2,
    triggerRate: 0.12
  },
  chaos: {
    key: 'chaos_surge',
    name: 'Chaos Surge',
    element: 'chaos',
    description: 'Chaotic pressure mutates arena danger each phase.',
    damageMultiplier: 1.2,
    triggerRate: 0.12
  },
  omni: {
    key: 'convergence_field',
    name: 'Convergence Field',
    element: 'omni',
    description: 'All elements converge into rotating arena pressure.',
    damageMultiplier: 1.25,
    triggerRate: 0.1
  }
};

export function getBossFloorEnvironmentalHazards(element: Element): DungeonEnvironmentalHazard[] {
  return [hazardByElement[element]];
}
