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
export {
  getElementIdentity,
  getStarterElements,
  getQuestOnlyElements,
  getWorld100Element,
  isStarterElement,
  isQuestOnlyElement,
  getElementModifiers,
  getElementSkillDamagePct,
  getElementCreatureAffinityPct,
  getElementContractStabilityPct,
  getElementEquipmentScalingPct,
  getElementCraftingSuccessPct,
  getElementDungeonRewardPct,
  getElementNPCReactionPct,
  getElementWorldTravelSpeedPct,
  getElementPVPIdentityModifier,
} from '../../data/playerElements';
export type {
  ElementIdentity,
  ElementIdentityModifiers,
  StarterElement,
  QuestOnlyElement,
} from '../../data/playerElements';
export {
  getElementCombatBonuses,
  getElementAffinityBonuses,
  getElementCraftingBonuses,
  applyElementSkillDamageBoost,
  applyElementAffinityBoost,
  applyElementContractStabilityBoost,
  applyElementCraftingBoost,
  canObtainElement,
  getElementCategory,
} from './elementIdentity';
export type {
  ElementCombatBonuses,
  ElementAffinityBonuses,
  ElementCraftingBonuses,
} from './elementIdentity';
