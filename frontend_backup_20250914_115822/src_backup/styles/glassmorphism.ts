import { colors } from './colors';

// Glassmorphism styles
export const glassmorphism = {
  // Main glass container
  container: {
    backgroundColor: colors.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  // Light glass container
  containerLight: {
    backgroundColor: colors.glassLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  // Dark glass container
  containerDark: {
    backgroundColor: colors.glassDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDark,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Glass button
  button: {
    backgroundColor: colors.glass,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  // Glass input
  input: {
    backgroundColor: colors.glassDark,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: colors.textPrimary,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Glass card
  card: {
    backgroundColor: colors.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },

  // Glass modal
  modal: {
    backgroundColor: colors.glass,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 30,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
};

// Common styles
export const commonStyles = {
  // Text styles
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },

  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 15,
  },

  body: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  caption: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 5,
  },

  // Layout styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Spacing
  marginVertical: {
    marginVertical: 10,
  },

  marginHorizontal: {
    marginHorizontal: 10,
  },

  padding: {
    padding: 20,
  },

  paddingHorizontal: {
    paddingHorizontal: 20,
  },

  paddingVertical: {
    paddingVertical: 20,
  },
};
