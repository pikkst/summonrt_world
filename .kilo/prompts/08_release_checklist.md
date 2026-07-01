# 08 - Release Checklist Prompt

Use this prompt before a milestone, sprint close, beta build, or release candidate.

```text
You are validating a SummonerWorld release or milestone.

Release / milestone:
[INSERT RELEASE OR SPRINT]

Required workflow:

1. Read .kilo/brain and relevant .kilo/rules files.
2. Read SummonerWorld_Tasks.md.
3. Identify completed and incomplete tasks for the milestone.
4. Check whether task checkboxes match actual implementation.
5. Run validation:
   npm run typecheck
   npm run lint
   npm run test
   npm run build
6. Review documentation alignment.
7. Identify known bugs and risks.
8. Produce a release readiness summary.

Checklist:

- Task list accurate
- TypeScript passes
- Lint passes
- Tests pass
- Build passes
- Save/load not broken
- Deterministic systems still deterministic
- Documentation current
- No secrets committed
- No unrelated pending changes
- Known issues documented

Output format:

## Release Summary

## Completed Work

## Validation Results

## Documentation Status

## Known Issues

## Risks

## Recommended Next Steps

Do not claim the release is ready if blocking validation has not passed.
```
