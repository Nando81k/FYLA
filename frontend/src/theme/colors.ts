/**
 * FYLA Design System - Color Palette
 * Modern, unisex, professional color scheme
 */

export const Colors = {
  // Light Mode Primary Colors
  light: {
    primary: '#5A4FCF',        // Royal Indigo - main brand color
    accent: '#F5C451',         // Soft Gold - luxury accent
    
    // Background Colors
    background: {
      primary: '#FAFAFA',      // Clean soft background
      secondary: '#FFFFFF',    // Card/section backgrounds
      tertiary: '#F5F5F7',     // Subtle alternate background
      accent: '#FFF8E1',       // Light gold accent background
    },
    
    // Text Colors
    text: {
      primary: '#1A1A1A',      // Crisp main text
      secondary: '#6B6B6B',    // Softer subtitle text
      tertiary: '#9B9B9B',     // Placeholder/disabled text
      accent: '#5A4FCF',       // Royal Indigo for accent text
      muted: '#AAAAAA',        // Muted text for subtle emphasis
      inverse: '#FFFFFF',      // Text on dark backgrounds
    },
    
    // Status Colors
    status: {
      success: '#34D399',      // Emerald green
      warning: '#F59E0B',      // Amber
      error: '#EF4444',        // Red
      info: '#3B82F6',         // Blue
    },
    
    // Neutral Grays
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    
    // Shadows
    shadow: {
      light: 'rgba(0, 0, 0, 0.03)',
      medium: 'rgba(0, 0, 0, 0.06)',
      strong: 'rgba(0, 0, 0, 0.1)',
    },
    
    // Borders
    border: {
      primary: '#E5E7EB',      // Primary border color
      light: '#F3F4F6',        // Very light borders
      medium: '#D1D5DB',       // Medium contrast borders
      strong: '#9CA3AF',       // Strong borders
    },
  },
  
  // Dark Mode Colors
  dark: {
    primary: '#AFAAFF',        // Lavender Mist - glows on dark
    accent: '#FFD88D',         // Elegant Champagne - warm contrast
    
    // Background Colors
    background: {
      primary: '#121212',      // Modern dark background
      secondary: '#1E1E1E',    // Card/modal background
      tertiary: '#2C2C2E',     // Subtle contrast alternate background
      accent: '#2A2419',       // Dark champagne accent background
    },
    
    // Text Colors
    text: {
      primary: '#F5F5F5',      // Bright white text
      secondary: '#AAAAAA',    // Softer gray text
      tertiary: '#6B6B6B',     // Subtle text
      accent: '#AFAAFF',       // Lavender Mist for accent text
      muted: '#999999',        // Muted text for subtle emphasis
      inverse: '#1A1A1A',      // Text on light backgrounds
    },
    
    // Status Colors (adjusted for dark mode)
    status: {
      success: '#10B981',      // Darker emerald
      warning: '#F59E0B',      // Amber (same)
      error: '#EF4444',        // Red (same)
      info: '#3B82F6',         // Blue (same)
    },
    
    // Neutral Grays (inverted)
    gray: {
      50: '#111827',
      100: '#1F2937',
      200: '#374151',
      300: '#4B5563',
      400: '#6B7280',
      500: '#9CA3AF',
      600: '#D1D5DB',
      700: '#E5E7EB',
      800: '#F3F4F6',
      900: '#F9FAFB',
    },
    
    // Shadows
    shadow: {
      light: 'rgba(255, 255, 255, 0.05)',
      medium: 'rgba(255, 255, 255, 0.1)',
      strong: 'rgba(255, 255, 255, 0.15)',
    },
    
    // Borders
    border: {
      primary: '#2C2C2E',      // Primary border color
      light: '#1E1E1E',        // Subtle borders
      medium: '#3A3A3C',       // Medium contrast borders
      strong: '#48484A',       // Strong borders
    },
  },
};

// Typography Scale
export const Typography = {
  // Font Sizes
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Font Weights
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// Spacing Scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 32,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 64,
};

// Border Radius
export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// Shadows
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Component Variants
export const ComponentStyles = {
  // Button Variants
  button: {
    primary: {
      backgroundColor: Colors.light.primary,
      borderColor: Colors.light.primary,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderColor: Colors.light.primary,
    },
    accent: {
      backgroundColor: Colors.light.accent,
      borderColor: Colors.light.accent,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
  },
  
  // Status Badge Colors
  statusBadge: {
    pending: {
      backgroundColor: Colors.light.status.warning + '20',
      color: Colors.light.status.warning,
    },
    confirmed: {
      backgroundColor: Colors.light.status.success + '20',
      color: Colors.light.status.success,
    },
    cancelled: {
      backgroundColor: Colors.light.status.error + '20',
      color: Colors.light.status.error,
    },
    completed: {
      backgroundColor: Colors.light.gray[300] + '20',
      color: Colors.light.gray[600],
    },
  },
};

// Export default theme (light mode)
export default {
  colors: Colors.light,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  components: ComponentStyles,
};
