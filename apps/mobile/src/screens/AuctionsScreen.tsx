import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useApp } from '../context/AppContext'
import { FONT_SIZE, SPACING } from '../utils/theme'

export function AuctionsScreen() {
  const { colors } = useApp()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.c, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Ionicons name="pricetags" size={48} color={colors.gold} />
      <Text style={[styles.h, { color: colors.text }]}>Leilões</Text>
      <Text style={[styles.p, { color: colors.textSecondary }]}>
        Terminal do investidor com score jurídico, ROI e contagem regressiva —
        conectado à mesma inteligência de leilões da plataforma. (Em construção)
      </Text>
    </View>
  )
}
const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  h: { fontSize: FONT_SIZE.xl, fontWeight: '800', marginTop: SPACING.base },
  p: { fontSize: FONT_SIZE.base, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 22 },
})
