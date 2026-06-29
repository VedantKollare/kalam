// Backward-compatibility barrel.
//
// The screenplay model was split into two focused modules:
//   • domain/screenplay → framework-free types + structural constants
//   • theme/tokens       → visual tokens (fonts, colours)
//
// Existing imports from '../types/screenplay' keep working via these re-exports.
// Prefer importing from the specific module in new code.
export * from '../domain/screenplay';
export * from '../theme/tokens';
