// Shared card style factory — extracted from the old HomeScreen so Home and
// Profile tabs share one definition instead of duplicating it.
export const mkCard = (tokens: any) => ({
  backgroundColor: tokens.surface,
  borderRadius: 16,
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
