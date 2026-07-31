export const theme = {
  colors: {
    // Light Mode (Default)
    background: '#F7F6F1',
    foreground: '#1C1B2E',
    
    card: '#FFFFFF',
    cardForeground: '#1C1B2E',
    
    primary: '#FF4757',
    primaryForeground: '#FFFFFF',
    
    secondary: '#FFF0F1',
    secondaryForeground: '#FF4757',
    
    muted: '#EEEDEA',
    mutedForeground: '#8B8A9A',
    
    accent: '#FFD32A',
    accentForeground: '#1C1B2E',
    
    destructive: '#d4183d',
    destructiveForeground: '#ffffff',
    
    border: 'rgba(28, 27, 46, 0.08)',
    input: 'transparent',
    inputBackground: '#EEEDEA',
  },
  typography: {
    fontFamily: {
      regular: 'Outfit_400Regular',
      medium: 'Outfit_500Medium',
      bold: 'Outfit_700Bold',
    },
    sizes: {
      xs: 11,
      sm: 13,
      base: 15,
      lg: 17,
      xl: 19,
      xxl: 22,
      xxxl: 26,
      display: 34,
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 9999,
  }
};

// Dark Mode overrides (optional implementation for later)
export const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#1C1B2E', // Simplified mapping for oklch(0.145 0 0)
    foreground: '#FFFFFF',
    card: '#2A293D',
    cardForeground: '#FFFFFF',
    primary: '#FF4757',
    primaryForeground: '#FFFFFF',
    secondary: '#3D3B54',
    secondaryForeground: '#FFFFFF',
    muted: '#3D3B54',
    mutedForeground: '#A1A0B2',
    border: 'rgba(255, 255, 255, 0.1)',
    inputBackground: '#3D3B54',
  }
};
