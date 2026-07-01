# Documentation Checklist

Use this checklist before completing documentation work.

## Source Review

- [ ] Correct source documents were read.
- [ ] `SummonerWorld_Tasks.md` was checked for task status.
- [ ] GDD was checked if gameplay is involved.
- [ ] TechnicalSpec was checked if architecture or persistence is involved.
- [ ] Relevant system bible was checked if available.

## Scope

- [ ] Documentation branch was created from `master`.
- [ ] Only relevant documentation was changed.
- [ ] No unrelated sections were rewritten.
- [ ] No planned work was described as implemented.
- [ ] No completed history was changed without evidence.

## Accuracy

- [ ] Documentation matches implementation.
- [ ] Task status matches actual work.
- [ ] Terminology is consistent.
- [ ] Dates and sprint references are accurate.
- [ ] Known limitations are documented.

## AI Framework Docs

- [ ] `.kilo/brain` updated if stable project identity changed.
- [ ] `.kilo/rules` updated if agent rules changed.
- [ ] `.kilo/prompts` updated if workflows changed.
- [ ] `.kilo/memory` updated if working state changed.

## PR

- [ ] PR states this is documentation-only if no runtime code changed.
- [ ] Validation section honestly states commands were not run if docs-only.
- [ ] Documentation impact is clearly described.
