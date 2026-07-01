# Bugfix Checklist

Use this checklist for bug fixes and regression prevention.

## Understanding

- [ ] The bug is clearly described.
- [ ] Expected behavior is clear.
- [ ] Actual behavior is clear.
- [ ] The likely owning module was identified.

## Fix Scope

- [ ] The fix changes the smallest safe area.
- [ ] No unrelated cleanup is included.
- [ ] The fix does not hide the bug by weakening validation.
- [ ] The fix does not remove useful assertions.

## Regression Protection

- [ ] A regression test was added or updated when practical.
- [ ] Existing tests still describe meaningful behavior.
- [ ] Deterministic systems remain deterministic.
- [ ] Save/load behavior is checked if persistent data is affected.

## Review

- [ ] QAEngineer review is used for important bug fixes.
- [ ] SystemIntegrator review is used if multiple systems are affected.
- [ ] PR notes explain the cause and fix.
