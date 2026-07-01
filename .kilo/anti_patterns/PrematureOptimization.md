# Premature Optimization

## Risk

Complex performance work is added before the actual bottleneck is known.

## Signs

- Hard-to-read code added for theoretical speed.
- Caches added without invalidation rules.
- Architecture becomes more complex without measurement.

## Preferred Direction

Use:

- simple readable code first
- tests
- measurement before optimization
- documented performance goals

## Rule

Optimize after there is evidence, not before.
