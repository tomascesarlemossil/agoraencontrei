/**
 * Design System — AgoraEncontrei (verde escuro militar + dourado).
 * Cores/escala vindas da identidade visual oficial. A chave `navy` é mantida
 * para compatibilidade com as telas, mas agora carrega o verde da marca.
 */
export const COLORS = {
  navy: '#143A1F', // verde escuro militar (cor primária da marca)
  gold: '#C9A84C',
  white: '#FFFFFF',
  // secundárias
  darkGray: '#333333',
  midGray: '#888888',
  lightGray: '#E5E5E5',
  offWhite: '#F8F9FA',
  // feedback
  success: '#2ECC71',
  error: '#E74C3C',
  warning: '#F1C40F',
  info: '#3498DB',
}

export const FONT_SIZE = { xs: 12, sm: 14, base: 16, md: 18, lg: 20, xl: 24, xxl: 32 }
export const RADIUS = { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 }
export const SPACING = { xs: 4, sm: 8, base: 16, md: 24, lg: 32, xl: 48 }

export type ThemeColors = typeof COLORS & {
  background: string
  card: string
  text: string
  textSecondary: string
  border: string
}

export function buildColors(isDark: boolean): ThemeColors {
  return {
    ...COLORS,
    background: isDark ? '#121212' : COLORS.offWhite,
    card: isDark ? '#1E1E1E' : COLORS.white,
    text: isDark ? COLORS.white : COLORS.navy,
    textSecondary: isDark ? '#AAAAAA' : COLORS.midGray,
    border: isDark ? '#333333' : COLORS.lightGray,
  }
}
