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
export { createCharacter, CONTRACT_PATHS } from './characterCreation.ts';
export type {
  ContractPath,
  ContractPathDefinition,
  CharacterCreationOptions,
  CharacterCreationResult,
} from './characterCreation.ts';
export {
  SUMMONER_CLASSES,
  getAllClasses,
  getClassById,
  getClassModifiers,
} from '../../data/summonerClasses';
export type { SummonerClassId, ClassDefinition } from '../../data/summonerClasses';
