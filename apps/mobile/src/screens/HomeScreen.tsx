import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApp } from '../context/AppContext'
import { Properties } from '../services/api'
import { FONT_SIZE, SPACING } from '../utils/theme'
import { flatListOptimizationProps } from '../utils/performance'
import { PropertyCard, Property } from '../components/PropertyCard'
import { Brand } from '../components/Brand'

export function HomeScreen() {
  const { colors, t } = useApp()
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const res: any = await Properties.list({ limit: 20 })
      const list = res?.data?.properties || res?.properties || res?.data || res || []
      setItems(Array.isArray(list) ? list : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Brand size={26} />
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>{t('tagline')}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it, i) => String(it.id ?? i)}
          renderItem={({ item }) => <PropertyCard property={item} />}
          contentContainerStyle={{ padding: SPACING.base, paddingBottom: insets.bottom + SPACING.xl }}
          ListHeaderComponent={
            <Text style={[styles.section, { color: colors.text }]}>{t('featured')}</Text>
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              {t('noProperties')}
            </Text>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} tintColor={colors.gold}
              onRefresh={() => { setRefreshing(true); load() }} />
          }
          {...flatListOptimizationProps}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm },
  tagline: { fontSize: FONT_SIZE.xs, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  section: { fontSize: FONT_SIZE.lg, fontWeight: '800', marginBottom: SPACING.sm },
  empty: { textAlign: 'center', marginTop: SPACING.xl },
})
