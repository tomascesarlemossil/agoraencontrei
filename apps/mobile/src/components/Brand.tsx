import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '../utils/theme'

/**
 * Marca textual AgoraEncontrei (Agora em navy, Encontrei em gold).
 * Substituir/acompanhar pelo logo oficial (monograma AE) quando os assets
 * forem adicionados em src/assets/ (icon.png, splash.png, logo.png).
 */
export function Brand({ size = 22 }: { size?: number }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.txt, { fontSize: size }]}>
        <Text style={{ color: COLORS.navy }}>Agora</Text>
        <Text style={{ color: COLORS.gold }}>Encontrei</Text>
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  txt: { fontWeight: '800', letterSpacing: -0.5 },
})
