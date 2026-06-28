import { SKILL_TEMPLATES } from '../modules/creatures/creatureFactory.ts';

export interface SkillPriority {
  key: string;
  tier: number;
  power: number;
}

export function getSkillPriority(skillKey: string): SkillPriority {
  const template = SKILL_TEMPLATES.find(s => s.key === skillKey);
  return {
    key: skillKey,
    tier: template?.tier ?? 0,
    power: template?.power ?? 0,
  };
}

export function inheritSkills(parentASkills: string[], parentBSkills: string[], selectedSkills: string[]): string[] {
  const parentSkillKeys = Array.from(new Set([...parentASkills, ...parentBSkills]));
  const skillsWithPriority = parentSkillKeys
    .map(getSkillPriority)
    .sort((a, b) => b.tier - a.tier || b.power - a.power);

  const inheritedSkills = skillsWithPriority.slice(0, 3).map(s => s.key);
  return [...inheritedSkills, ...selectedSkills.slice(0, 4 - inheritedSkills.length)];
}
