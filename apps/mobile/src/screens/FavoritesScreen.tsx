import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useApp } from '../context/AppContext'
import { Properties } from '../services/api'
import { FONT_SIZE, SPACING } from '../utils/theme'
import { flatListOptimizationProps } from '../utils/performance'
import { PropertyCard, Property } from '../components/PropertyCard'

export function FavoritesScreen() {
  const { colors, favorites } = useApp()
  const [items, setItems] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const results = await Promise.all(
        favorites.map(async (id) => {
          try {
            const res: any = await Properties.get(id)
            return (res?.data?.property || res?.property || res?.data || res) as Property
          } catch { return null }
        }),
      )
      setItems(results.filter(Boolean) as Property[])
    } finally { setLoading(false) }
  }, [favorites])

  useEffect(() => { load() }, [load])

  if (loading) return <View style={[styles.c, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.gold} /></View>

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={items}
        keyExtractor={(it, i) => String(it.id ?? i)}
        renderItem={({ item }) => <PropertyCard property={item} />}
        contentContainerStyle={{ padding: SPACING.base }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>
              Você ainda não favoritou imóveis. Toque no ♥ nos cards.
            </Text>
          </View>
        }
        {...flatListOptimizationProps}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', marginTop: SPACING.xl, paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  emptyTxt: { fontSize: FONT_SIZE.base, textAlign: 'center' },
})
