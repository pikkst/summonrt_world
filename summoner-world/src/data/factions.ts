import type { Faction } from '../types/game';

export const FACTIONS: Record<string, Faction> = {
  merchant_guild: {
    id: 'merchant_guild',
    name: 'Merchant Guild',
    description: 'A coalition of traders seeking wealth and open markets.',
    defaultPower: 50,
    power: 50,
    alignment: 'order',
  },
  circle_of_nature: {
    id: 'circle_of_nature',
    name: 'Circle of Nature',
    description: 'Guardians of the wild who protect the balance of life.',
    defaultPower: 50,
    power: 50,
    alignment: 'nature',
  },
  void_cult: {
    id: 'void_cult',
    name: 'Void Cult',
    description: 'Seekers of forbidden power who embrace entropy.',
    defaultPower: 50,
    power: 50,
    alignment: 'chaos',
  },
  iron_league: {
    id: 'iron_league',
    name: 'Iron League',
    description: 'Militaristic traditionalists enforcing stability through strength.',
    defaultPower: 50,
    power: 50,
    alignment: 'order',
  },
};

export const FACTION_IDS = Object.keys(FACTIONS);
