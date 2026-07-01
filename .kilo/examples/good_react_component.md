# Good UI Component Example

## Purpose

UI components should stay focused on presentation and user intent.

## Recommended Shape

A good component should:

- Use typed props.
- Render one clear UI section.
- Send user intent through a callback.
- Keep gameplay calculations outside the component.
- Include accessible labels when useful.

## Example

Component: DungeonFloorCard

Props:

- floor summary
- enter floor handler

Responsibilities:

- show floor number
- show room count
- show boss reachability
- call the handler when the player chooses to enter

## Why This Is Good

- The component stays small.
- Dungeon rules remain in core logic.
- UI remains easy to test.
