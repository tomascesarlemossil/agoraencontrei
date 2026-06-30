import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

export const triggerHaptic = (
  style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light',
) => {
  if (Platform.OS === 'web') return
  switch (style) {
    case 'light': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break
    case 'medium': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break
    case 'heavy': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break
    case 'success': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break
    case 'warning': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break
    case 'error': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break
  }
}

// Props recomendadas para FlatList de imóveis (listas longas e fluidas).
export const flatListOptimizationProps = {
  removeClippedSubviews: true,
  maxToRenderPerBatch: 5,
  updateCellsBatchingPeriod: 30,
  initialNumToRender: 4,
  windowSize: 5,
}

export const formatBRL = (v: number | string) =>
  `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
