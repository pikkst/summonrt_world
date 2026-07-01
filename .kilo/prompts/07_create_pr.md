# 07 - Create Pull Request Prompt

Use this prompt when preparing a Pull Request.

```text
You are preparing a Pull Request for SummonerWorld.

Branch:
[INSERT BRANCH]

Task or purpose:
[INSERT TASK / PURPOSE]

Required workflow:

1. Confirm work is not on master.
2. Confirm branch name matches the task or purpose.
3. Confirm the PR contains only related changes.
4. Run validation when code changed:
   npm run typecheck
   npm run lint
   npm run test
   npm run build
5. Check documentation impact.
6. Write a clear PR title.
7. Write a PR body using the required template.
8. Open PR into master.

PR title format:

```text
Implement T6.12 world 10 dungeon simulation
Fix dungeon boss floor reachability
Add Kilo prompts workflow
Update Player Core documentation
```

PR body template:

```text
## Summary
- What changed
- Why it changed
- Which task it completes, if applicable

## Validation
- [ ] npm run typecheck
- [ ] npm run lint
- [ ] npm run test
- [ ] npm run build

## Documentation
- Docs updated:
- Docs not needed because:

## Notes
- Known limitations
- Follow-up tasks
```

Rules:

- Be honest if validation was not run.
- Do not claim tests passed if they were not run.
- Mention documentation-only changes clearly.
- Mention known limitations.
- Do not include unrelated task claims.
```
