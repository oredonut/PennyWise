import { Radius } from '../../tokens';

// Shared card style factory — extracted from the old HomeScreen so Home and
// Profile tabs share one definition instead of duplicating it.
// Default content-card radius is --r-lg (20). The Discipline Score card is the
// only card that overrides this to --r-xl (28); see design.md §4 radius rules.
export const mkCard = (tokens: any) => ({
  backgroundColor: tokens.surface,
  borderRadius: Radius.lg,
  padding: 16,
  marginHorizontal: 16,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: tokens.border,
  shadowColor: '#000',
  shadowOpacity: 0.04,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
});
