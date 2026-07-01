export type {
  PlayerCoreState,
  SummonerClass,
  PlayerIdentity,
  SummonerProfile,
  SkillEntry,
  TalentNode,
  TitleEntry,
  AchievementEntry,
  PlayerStatistics,
  ReputationState,
  EquipmentSlot,
  EquipmentSlotId,
  CreatureContract,
  HousingReference,
  WorldUnlocks,
  SaveMetadata,
} from '../../types/playerCore.ts';

export { createDefaultPlayerCoreState, migratePlayerStateToCore } from './factory.ts';
export { createCharacter, SUMMONER_CLASSES, CONTRACT_PATHS } from './characterCreation.ts';
export type {
  ContractPath,
  ContractPathDefinition,
  SummonerClassId,
  ClassDefinition,
  CharacterCreationOptions,
  CharacterCreationResult,
} from './characterCreation.ts';
