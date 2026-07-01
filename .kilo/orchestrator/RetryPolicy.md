# Retry Policy

## Purpose

Define safe retry behavior for AI task execution.

## Retry Rules

Retry only after identifying the likely cause of failure.

A retry should improve one of these:

- context selection
- implementation approach
- test understanding
- affected file set
- validation focus

## Safe Retry Examples

- Read the failing test file before editing code again.
- Load the related pattern before changing structure.
- Reduce the patch size.
- Move discovered extra work into a follow-up task.

## Retry Limit

After two failed retries:

1. Stop.
2. Summarize attempts.
3. Identify likely blocker.
4. Recommend the next focused step.

## Rule

Retries must become more informed and more focused.
