# Council Routing

## Purpose

Choose council roles based on the task type and affected systems.

## Routing Rule

Use the smallest useful council set.

Do not ask every role for every task.

## Common Routes

### Architecture Change

Use:

- ChiefArchitect
- TechnicalDirector
- SystemIntegrator
- AIHistorian

### New Gameplay Feature

Use:

- GameplayDirector
- PlayerAdvocate
- primary domain designer
- LeadProgrammer
- QAEngineer

### Dungeon Feature

Use:

- DungeonDesigner
- GameplayDirector
- SystemIntegrator
- QAEngineer
- PerformanceEngineer if simulation or generation scale is affected

### Economy or Rewards

Use:

- EconomyDesigner
- GameplayDirector
- SystemIntegrator
- SecurityEngineer if trade, currency, or future online state is affected

### UI / UX Feature

Use:

- UXDesigner
- PlayerAdvocate
- LeadProgrammer
- QAEngineer

### Documentation-only Change

Use:

- DocumentationEngineer
- AIHistorian when architecture memory changes

## Escalation

Escalate to ChiefArchitect when:

- system ownership is unclear
- new core module is proposed
- save/load shape changes
- event/action/report architecture changes
- future online compatibility is uncertain
