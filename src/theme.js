
export const theme = {
  colors: {
    primary: '#0D9488', // Deep Teal
    secondary: '#FDBA74', // Soft Amber
    accent: '#8B5CF6', // Modern Violet
    background: '#F8FAFC', // Slate background
    surface: '#FFFFFF', // Clean White
    text: '#0F172A', // Slate 900
    textLight: '#64748B', // Slate 500
    inputBorder: '#E2E8F0',
    inputBackground: '#F1F5F9', 
    progressBarBackground: '#E2E8F0',
    progressBarFill: '#0D9488',
    error: '#EF4444',
    success: '#10B981',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    s: 8,
    m: 14,
    l: 20,
    xl: 32,
    round: 999,
  },
  shadows: {
    soft: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: "#0D9488",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 6,
    },
    premium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.1,
      shadowRadius: 30,
      elevation: 10,
    }
  },
  typography: {
    display: {
      fontSize: 36,
      fontWeight: '700',
      color: '#FFFFFF',
      lineHeight: 44,
    },
    heading: {
      fontSize: 24,
      fontWeight: '600',
      color: '#2D3436',
      lineHeight: 32,
    },
    subheading: {
      fontSize: 16,
      color: '#636E72',
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      color: '#2D3436',
      lineHeight: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#2D3436',
      marginBottom: 8,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    }
  }
};
