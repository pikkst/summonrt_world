# 05 - Write Tests Prompt

Use this prompt when adding or improving tests.

```text
You are adding tests for SummonerWorld.

Test target:
[INSERT SYSTEM / FUNCTION / BUG / TASK]

Required workflow:

1. Read .kilo/brain and relevant .kilo/rules files, especially 04_TESTING_RULES.md.
2. Identify existing tests for the target system.
3. Identify meaningful gameplay invariants.
4. Add tests in the existing test style.
5. Avoid testing implementation details unless necessary.
6. Run validation:
   npm run typecheck
   npm run lint
   npm run test
   npm run build
7. Open a Pull Request if this is a standalone test task.

Test design rules:

- Prefer behavior over implementation details.
- Test deterministic systems with fixed seeds.
- Test invalid input when relevant.
- Test edge cases.
- Add regression tests for bugs.
- Keep tests readable.

Suggested test categories:

- Unit tests for pure functions.
- Integration tests for cross-system behavior.
- Regression tests for fixed bugs.
- Simulation tests for long-running systems.
- Save/load round-trip tests for persistent state.

Before writing tests, produce:

- Existing test files found
- Test cases to add
- Invariants being protected
- Any missing test utilities

After writing tests, produce:

- Tests added
- What behavior is protected
- Validation results
- Any follow-up test gaps
```
