# 05 - Action System

## Principle

Most gameplay can be represented as Actions.

An Action is a player-directed or system-directed process that takes time, has requirements, produces results, and may create events.

## Examples

Actions include:

- quest
- dungeon expedition
- travel
- training
- crafting
- research
- fusion
- evolution
- building
- trading
- settlement upgrade
- guild mission

## Common Action Concepts

Actions should usually define:

- owner
- participants
- location
- requirements
- duration
- risk
- state
- progress
- rewards
- failure outcome
- report
- generated events

## Design Benefit

A common Action model reduces duplicated systems.

It allows quests, crafting, dungeon runs, training, travel, and research to share architecture where appropriate.

## AI Rule

Before creating a one-off workflow, ask whether it should be modeled as an Action.
