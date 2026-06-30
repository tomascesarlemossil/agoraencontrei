import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useApp } from '../context/AppContext'
import { Catalog } from '../services/api'
import { FONT_SIZE, RADIUS, SPACING } from '../utils/theme'
import { formatBRL, triggerHaptic } from '../utils/performance'

// Assinatura é feita pela WEB (sem comissão de loja). O app abre o checkout no site.
const WEB_CHECKOUT = 'https://www.agoraencontrei.com.br/parceiros/cadastro'

type Plan = { id: string; slug: string; name: string; description?: string; priceMonthly: number; features?: string[]; highlighted?: boolean }

export function PartnersScreen() {
  const { colors, t } = useApp()
  const insets = useSafeAreaInsets()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res: any = await Catalog.get()
      setPlans(res?.data?.plans || res?.plans || [])
    } catch { setPlans([]) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <ScrollView style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: SPACING.base, paddingTop: insets.top + SPACING.base, paddingBottom: insets.bottom + SPACING.xl }}>
      <Text style={[styles.h1, { color: colors.text }]}>{t('beAPartner')}</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        Planos do sistema AgoraEncontrei — os mesmos da plataforma web, ao vivo.
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: SPACING.xl }} />
      ) : plans.length === 0 ? (
        <Text style={[styles.sub, { color: colors.textSecondary, marginTop: SPACING.lg }]}>
          Não foi possível carregar os planos agora.
        </Text>
      ) : (
        plans.map((p) => (
          <View key={p.id} style={[styles.card, { backgroundColor: colors.card, borderColor: p.highlighted ? colors.gold : colors.border }]}>
            {p.highlighted && <Text style={[styles.badge, { backgroundColor: colors.gold, color: colors.navy }]}>Mais Popular</Text>}
            <Text style={[styles.name, { color: colors.text }]}>{p.name}</Text>
            {!!p.description && <Text style={[styles.desc, { color: colors.textSecondary }]}>{p.description}</Text>}
            <Text style={[styles.price, { color: colors.gold }]}>{formatBRL(p.priceMonthly)}<Text style={[styles.mo, { color: colors.textSecondary }]}>/mês</Text></Text>
            {(p.features || []).slice(0, 6).map((f, i) => (
              <View key={i} style={styles.feat}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.featTxt, { color: colors.text }]}>{f}</Text>
              </View>
            ))}
            <Pressable accessibilityRole="button" accessibilityLabel={`Assinar ${p.name} no site`}
              onPress={() => { triggerHaptic('light'); Linking.openURL(`${WEB_CHECKOUT}?plan=${p.slug}`) }}
              style={[styles.cta, { backgroundColor: p.highlighted ? colors.gold : colors.navy }]}>
              <Text style={[styles.ctaTxt, { color: p.highlighted ? colors.navy : colors.white }]}>{t('subscribeOnSite')}</Text>
              <Ionicons name="open-outline" size={16} color={p.highlighted ? colors.navy : colors.white} />
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  h1: { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  sub: { fontSize: FONT_SIZE.sm, marginTop: 4 },
  card: { borderRadius: RADIUS.lg, borderWidth: 1.5, padding: SPACING.base, marginTop: SPACING.base },
  badge: { alignSelf: 'flex-start', fontSize: FONT_SIZE.xs, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: SPACING.sm },
  name: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  desc: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  price: { fontSize: FONT_SIZE.xl, fontWeight: '800', marginTop: SPACING.sm },
  mo: { fontSize: FONT_SIZE.sm, fontWeight: '400' },
  feat: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  featTxt: { fontSize: FONT_SIZE.sm, flex: 1 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: SPACING.base, paddingVertical: SPACING.sm, borderRadius: RADIUS.full },
  ctaTxt: { fontWeight: '800', fontSize: FONT_SIZE.base },
})
