# Context Escalation

## Purpose

Escalate context only when the current context is insufficient.

## Escalation Triggers

Load more context when:

- the task affects multiple systems
- ownership is unclear
- save/load impact is unclear
- tests show failures in related systems
- existing implementation cannot be found
- a rule conflict appears
- architecture risk is discovered

## Escalation Levels

### Minimal to Standard

Use when a small task touches real gameplay logic.

### Standard to Deep

Use when a task crosses systems, persistence, architecture, or future online safety.

## Escalation Process

1. Stop coding.
2. Summarize current understanding.
3. Name the missing information.
4. Load the next most relevant document or file.
5. Update the plan.

## Avoid

- Escalating because the agent is curious.
- Loading entire large documents when one section is enough.
- Continuing to code after discovering unclear ownership.
