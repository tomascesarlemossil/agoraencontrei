import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, Pressable, Image, ActivityIndicator, RefreshControl, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useApp } from '../context/AppContext'
import { Auctions } from '../services/api'
import { FONT_SIZE, RADIUS, SPACING } from '../utils/theme'
import { flatListOptimizationProps, triggerHaptic, formatBRL } from '../utils/performance'

type Auction = {
  id?: string | number
  title?: string
  city?: string
  imageUrl?: string
  images?: string[]
  minBid?: number
  appraisalValue?: number
  discount?: number
  endsAt?: string
  source?: string
  url?: string
}

function daysLeft(endsAt?: string): string | null {
  if (!endsAt) return null
  const diff = new Date(endsAt).getTime() - Date.now()
  if (isNaN(diff)) return null
  if (diff <= 0) return 'Encerrado'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  return d > 0 ? `${d}d ${h}h` : `${h}h`
}

export function AuctionsScreen() {
  const { colors } = useApp()
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const res: any = await Auctions.list({ limit: 30 })
      const list = res?.data?.auctions || res?.auctions || res?.data || res || []
      setItems(Array.isArray(list) ? list : [])
    } catch { setItems([]) } finally { setLoading(false); setRefreshing(false) }
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Text style={[styles.h1, { color: colors.text }]}>Leilões</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>Oportunidades com score e ROI — ao vivo.</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: SPACING.xl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it, i) => String(it.id ?? i)}
          contentContainerStyle={{ padding: SPACING.base, paddingBottom: insets.bottom + SPACING.xl }}
          refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.gold} onRefresh={() => { setRefreshing(true); load() }} />}
          renderItem={({ item }) => {
            const img = item.imageUrl || item.images?.[0]
            const left = daysLeft(item.endsAt)
            const disc = item.discount ?? (item.appraisalValue && item.minBid ? Math.round((1 - item.minBid / item.appraisalValue) * 100) : undefined)
            return (
              <Pressable accessibilityRole="button" accessibilityLabel={`Leilão ${item.title || ''}`}
                onPress={() => { triggerHaptic('light'); if (item.url) Linking.openURL(item.url) }}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {img ? <Image source={{ uri: img }} style={styles.img} /> :
                  <View style={[styles.img, styles.noImg, { backgroundColor: colors.lightGray }]}><Ionicons name="hammer" size={28} color={colors.midGray} /></View>}
                {!!disc && disc > 0 && <Text style={[styles.disc, { backgroundColor: colors.error }]}>{disc}% OFF</Text>}
                <View style={{ padding: SPACING.base }}>
                  <Text numberOfLines={2} style={[styles.title, { color: colors.text }]}>{item.title || 'Imóvel em leilão'}</Text>
                  <Text style={[styles.loc, { color: colors.textSecondary }]}>{[item.city, item.source].filter(Boolean).join(' · ')}</Text>
                  <View style={styles.row}>
                    {!!item.minBid && <Text style={[styles.bid, { color: colors.gold }]}>{formatBRL(item.minBid)}</Text>}
                    {!!left && (
                      <View style={[styles.timer, { borderColor: colors.border }]}>
                        <Ionicons name="time" size={13} color={colors.textSecondary} />
                        <Text style={[styles.timerTxt, { color: colors.textSecondary }]}>{left}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            )
          }}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>Nenhum leilão disponível agora. Puxe para atualizar.</Text>}
          {...flatListOptimizationProps}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm },
  h1: { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  sub: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  card: { borderRadius: RADIUS.lg, borderWidth: 1, overflow: 'hidden', marginBottom: SPACING.base },
  img: { width: '100%', height: 160 },
  noImg: { alignItems: 'center', justifyContent: 'center' },
  disc: { position: 'absolute', top: 10, left: 10, color: '#fff', fontWeight: '800', fontSize: FONT_SIZE.xs, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm, overflow: 'hidden' },
  title: { fontSize: FONT_SIZE.base, fontWeight: '700' },
  loc: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.sm },
  bid: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  timerTxt: { fontSize: FONT_SIZE.xs },
  empty: { textAlign: 'center', marginTop: SPACING.xl },
})
