# Pull Request Checklist

Use this checklist before opening or updating a Pull Request.

## Scope

- [ ] One task equals one branch and one PR.
- [ ] PR targets `master`.
- [ ] PR title is clear.
- [ ] Summary explains what changed.
- [ ] Out-of-scope work is not included.

## Validation

- [ ] `npm run typecheck` was run or not-run reason is stated.
- [ ] `npm run lint` was run or not-run reason is stated.
- [ ] `npm run test` was run or not-run reason is stated.
- [ ] `npm run build` was run or not-run reason is stated.

## Documentation

- [ ] Documentation impact is handled.
- [ ] Task or progress docs are updated when needed.
- [ ] Architecture notes are updated when needed.

## Final Review Todo

- [ ] Todo list includes `Run Final Review before PR creation`.
- [ ] Final Review todo is completed after validation.
- [ ] Architecture was checked.
- [ ] User flow was checked when relevant.
- [ ] API quality was checked when relevant.
- [ ] Save/load impact was checked when relevant.
- [ ] Merge readiness was checked before opening or updating the PR.

## Review Readiness

- [ ] Known limitations are listed.
- [ ] Follow-up work is listed.
- [ ] PR does not claim validation that was not run.
- [ ] Reviewers can understand the change without guessing.
