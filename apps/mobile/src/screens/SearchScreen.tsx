import React, { useState, useCallback } from 'react'
import { View, Text, TextInput, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useApp } from '../context/AppContext'
import { Properties } from '../services/api'
import { FONT_SIZE, RADIUS, SPACING } from '../utils/theme'
import { flatListOptimizationProps, triggerHaptic } from '../utils/performance'
import { PropertyCard, Property } from '../components/PropertyCard'

export function SearchScreen() {
  const { colors } = useApp()
  const insets = useSafeAreaInsets()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = useCallback(async () => {
    triggerHaptic('light'); setLoading(true); setSearched(true)
    try {
      const res: any = await Properties.list({ q, limit: 30 })
      const list = res?.data?.properties || res?.properties || res?.data || res || []
      setItems(Array.isArray(list) ? list : [])
    } catch { setItems([]) } finally { setLoading(false) }
  }, [q])

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          value={q} onChangeText={setQ} onSubmitEditing={search} returnKeyType="search"
          placeholder="Cidade, bairro ou tipo de imóvel" placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text }]}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Buscar" onPress={search}>
          <Ionicons name="arrow-forward-circle" size={28} color={colors.gold} />
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it, i) => String(it.id ?? i)}
          renderItem={({ item }) => <PropertyCard property={item} />}
          contentContainerStyle={{ padding: SPACING.base, paddingBottom: insets.bottom + SPACING.xl }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              {searched ? 'Nenhum imóvel encontrado.' : 'Busque imóveis em tempo real.'}
            </Text>
          }
          {...flatListOptimizationProps}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, margin: SPACING.base, paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1 },
  input: { flex: 1, fontSize: FONT_SIZE.base },
  empty: { textAlign: 'center', marginTop: SPACING.xl },
})
