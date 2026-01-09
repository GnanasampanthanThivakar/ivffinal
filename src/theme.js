
export const theme = {
  colors: {
    primary: '#40918B', // Teal
    secondary: '#FFCBA4', // Peach
    background: '#FAFAFA', // Light Gray for general backgrounds
    surface: '#FFFFFF', // White for cards
    text: '#2D3436', // Softer black
    textLight: '#636E72', // Softer gray
    inputBorder: '#DFE6E9',
    inputBackground: '#F0F2F5', // Very light gray for inputs
    progressBarBackground: '#DFE6E9',
    progressBarFill: '#40918B',
    error: '#D63031',
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
    m: 12,
    l: 16,
    xl: 24,
    round: 50,
  },
  shadows: {
    soft: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 5,
    },
    hard: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
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
