# Automated Review Guidance

- Skip automated review comments for:
  1. TypeScript type used before its declaration in the same file (forward references are legal and re-ordering churn is low-value).
  2. Unused imports/types flagged via `noUnusedLocals` when the symbol is an explicit return-type annotation or imported solely for documentation.
  3. Minor indentation inconsistencies that are stylistic rather than syntactically invalid.
  4. Dead-code or unused-parameter warnings on functions that may be part of a planned API surface or are intentionally extensible.
- Focus automated review on genuine runtime/correctness issues (undefined dereferences, undefined imports causing compilation failure, deterministic-generation violations, missing interface members on return objects).
