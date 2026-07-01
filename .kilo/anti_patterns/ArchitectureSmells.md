# Architecture Smells

## Risk

The code still works, but its structure suggests future maintenance problems.

## Signs

- Unclear ownership.
- Many unrelated imports.
- Large files with mixed responsibilities.
- New systems duplicate existing ones.
- Validation, simulation, persistence, and UI are mixed.

## Preferred Direction

Use:

- `.kilo/context_engine`
- `.kilo/patterns`
- `.kilo/checklists`
- architecture review before implementation

## Rule

When structure feels unclear, pause and ask which system owns the behavior.
