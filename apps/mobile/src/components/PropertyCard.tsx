import React, { memo } from 'react'
import { View, Text, Image, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useApp } from '../context/AppContext'
import { FONT_SIZE, RADIUS, SPACING } from '../utils/theme'
import { triggerHaptic, formatBRL } from '../utils/performance'

export type Property = {
  id?: string | number
  title?: string
  price?: number | string
  city?: string
  neighborhood?: string
  bedrooms?: number
  bathrooms?: number
  area?: number
  imageUrl?: string
  images?: string[]
}

function Card({ property, onPress }: { property: Property; onPress?: () => void }) {
  const { colors } = useApp()
  const img = property.imageUrl || property.images?.[0]
  return (
    <Pressable
      accessible accessibilityRole="button"
      accessibilityLabel={`Imóvel ${property.title || ''}`}
      onPress={() => { triggerHaptic('light'); onPress?.() }}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {img ? (
        <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.noImage, { backgroundColor: colors.lightGray }]}>
          <Ionicons name="home" size={32} color={colors.midGray} />
        </View>
      )}
      <View style={styles.body}>
        {!!property.price && (
          <Text style={[styles.price, { color: colors.gold }]}>{formatBRL(property.price)}</Text>
        )}
        <Text numberOfLines={2} style={[styles.title, { color: colors.text }]}>
          {property.title || 'Imóvel'}
        </Text>
        <Text numberOfLines={1} style={[styles.loc, { color: colors.textSecondary }]}>
          {[property.neighborhood, property.city].filter(Boolean).join(' · ') || '—'}
        </Text>
        <View style={styles.specs}>
          {!!property.bedrooms && <Spec icon="bed" label={`${property.bedrooms}`} color={colors.textSecondary} />}
          {!!property.bathrooms && <Spec icon="water" label={`${property.bathrooms}`} color={colors.textSecondary} />}
          {!!property.area && <Spec icon="resize" label={`${property.area} m²`} color={colors.textSecondary} />}
        </View>
      </View>
    </Pressable>
  )
}

function Spec({ icon, label, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }) {
  return (
    <View style={styles.spec}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.specTxt, { color }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden', marginBottom: SPACING.base },
  image: { width: '100%', height: 180 },
  noImage: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: SPACING.base },
  price: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  title: { fontSize: FONT_SIZE.base, fontWeight: '600', marginTop: 2 },
  loc: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  specs: { flexDirection: 'row', gap: SPACING.base, marginTop: SPACING.sm },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  specTxt: { fontSize: FONT_SIZE.xs },
})

export const PropertyCard = memo(Card)
