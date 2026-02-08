/**
 * Careerist Brand Theme Configuration
 * Professional industry-grade theme system
 */

export const careeristTheme = {
  colors: {
    // Primary Brand Colors
    primaryYellow: '#F4B400',
    primaryNavy: '#1F3A5F',
    
    // Neutral System
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E5E7EB',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    
    // Functional Colors
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Sidebar specific
    sidebarBg: '#1F3A5F',
    sidebarText: '#CBD5F5',
    sidebarActive: '#F4B400',
    sidebarHover: 'rgba(244, 180, 0, 0.1)',
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      display: ['Inter', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  spacing: {
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.5rem',
    },
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
  },
  
  components: {
    button: {
      primary: {
        bg: '#F4B400',
        text: '#1F3A5F',
        hover: '#E0A300',
      },
      secondary: {
        bg: '#1F3A5F',
        text: '#FFFFFF',
        hover: '#152A4A',
      },
      ghost: {
        border: '#1F3A5F',
        text: '#1F3A5F',
        hover: 'rgba(31, 58, 95, 0.1)',
      },
    },
    card: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      radius: '0.75rem',
      shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    },
    table: {
      headerBg: '#1F3A5F',
      headerText: '#FFFFFF',
      rowHover: 'rgba(244, 180, 0, 0.05)',
    },
  },
}

export default careeristTheme

