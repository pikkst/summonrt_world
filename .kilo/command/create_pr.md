---
description: Prepare and open a Pull Request
agent: code
---
# Create Pull Request

Use this command to prepare and open a GitHub Pull Request.

Read `.kilo/prompts/07_create_pr.md` for the full workflow.

Required steps:
1. Verify branch is not `master`.
2. Confirm Kilo Workflow Evidence exists for the implemented task.
3. Run validation commands.
4. Check task status in `SummonerWorld_Tasks.md`.
5. Confirm task status and documentation updates are already staged or committed when required.
6. Run `.kilo/orchestrator/ReviewPipeline.md`.
7. Run relevant `.kilo/checklists` and `.kilo/rules/99_FINAL_CHECKLIST.md`.
8. Run `.kilo/guardian/GuardianGate.md`.
9. Commit changes with a clear message.
10. Push branch.
11. Open PR targeting `master`.

Do not open or update a PR without a Guardian status and honest validation results.
