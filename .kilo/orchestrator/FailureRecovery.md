# Failure Recovery

## Purpose

Recover safely when a task becomes unclear, validation fails, or the agent gets stuck.

## General Recovery Loop

```text
Stop
  -> Summarize what is known
    -> Identify the failure
      -> Load only needed extra context
        -> Re-plan
          -> Continue or report limitation
```

## Common Failures

### Existing implementation not found

- Search relevant source folders.
- Load module context.
- Ask whether a new module is truly required.

### Tests fail

- Read failing test output.
- Identify whether behavior or test expectation changed.
- Do not weaken assertions to hide failures.

### Build fails

- Fix TypeScript errors directly.
- Do not suppress errors without reason.

### Scope expands

- Stop implementation.
- Document discovered follow-up work.
- Keep the current PR focused.

### Architecture unclear

- Load architect agent.
- Load relevant pattern.
- Re-plan before editing more files.

## Rule

Do not generate random replacement code when stuck.

Recover by narrowing context and identifying the real blocker.
