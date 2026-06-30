import React, { useState } from 'react'
import { View, Text, ScrollView, Image, StyleSheet, Pressable, Dimensions, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useApp } from '../context/AppContext'
import { FONT_SIZE, RADIUS, SPACING } from '../utils/theme'
import { triggerHaptic, formatBRL } from '../utils/performance'
import type { RootStackParamList } from '../navigation/types'

const { width } = Dimensions.get('window')

type Props = NativeStackScreenProps<RootStackParamList, 'PropertyDetail'>

export function PropertyDetailScreen({ route }: Props) {
  const { colors } = useApp()
  const p = route.params.property
  const images: string[] = (p.images && p.images.length ? p.images : [p.imageUrl].filter(Boolean) as string[])
  const [idx, setIdx] = useState(0)

  const phone = (p as any).phone || (p as any).contactPhone
  const waText = encodeURIComponent(`Olá! Tenho interesse no imóvel "${p.title || ''}".`)

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
      {images.length > 0 ? (
        <View>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {images.map((uri, i) => (
              <Image key={i} source={{ uri }} style={{ width, height: 280 }} resizeMode="cover" />
            ))}
          </ScrollView>
          {images.length > 1 && (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, { backgroundColor: i === idx ? colors.gold : 'rgba(255,255,255,0.6)' }]} />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.noImg, { backgroundColor: colors.lightGray }]}>
          <Ionicons name="home" size={48} color={colors.midGray} />
        </View>
      )}

      <View style={{ padding: SPACING.base }}>
        {!!p.price && <Text style={[styles.price, { color: colors.gold }]}>{formatBRL(p.price)}</Text>}
        <Text style={[styles.title, { color: colors.text }]}>{p.title || 'Imóvel'}</Text>
        <Text style={[styles.loc, { color: colors.textSecondary }]}>
          {[p.neighborhood, p.city].filter(Boolean).join(' · ') || '—'}
        </Text>

        <View style={[styles.specs, { borderColor: colors.border }]}>
          <Spec icon="bed" label="Quartos" value={p.bedrooms} colors={colors} />
          <Spec icon="water" label="Banheiros" value={p.bathrooms} colors={colors} />
          <Spec icon="resize" label="Área" value={p.area ? `${p.area} m²` : undefined} colors={colors} />
        </View>

        {!!(p as any).description && (
          <>
            <Text style={[styles.h, { color: colors.text }]}>Descrição</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{(p as any).description}</Text>
          </>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="WhatsApp"
          onPress={() => { triggerHaptic('success'); Linking.openURL(`https://wa.me/${(phone || '').replace(/\D/g, '')}?text=${waText}`) }}
          style={[styles.btn, { backgroundColor: '#25D366' }]}>
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          <Text style={styles.btnTxt}>WhatsApp</Text>
        </Pressable>
        {!!phone && (
          <Pressable accessibilityRole="button" accessibilityLabel="Ligar"
            onPress={() => { triggerHaptic('light'); Linking.openURL(`tel:${phone}`) }}
            style={[styles.btn, { backgroundColor: colors.navy }]}>
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.btnTxt}>Ligar</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  )
}

function Spec({ icon, label, value, colors }: any) {
  return (
    <View style={styles.spec}>
      <Ionicons name={icon} size={20} color={colors.gold} />
      <Text style={[styles.specVal, { color: colors.text }]}>{value ?? '—'}</Text>
      <Text style={[styles.specLbl, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  dots: { position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  noImg: { width: '100%', height: 220, alignItems: 'center', justifyContent: 'center' },
  price: { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  title: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginTop: 4 },
  loc: { fontSize: FONT_SIZE.base, marginTop: 2 },
  specs: { flexDirection: 'row', justifyContent: 'space-around', borderWidth: 1, borderRadius: RADIUS.lg, paddingVertical: SPACING.base, marginTop: SPACING.base },
  spec: { alignItems: 'center', gap: 2 },
  specVal: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  specLbl: { fontSize: FONT_SIZE.xs },
  h: { fontSize: FONT_SIZE.md, fontWeight: '800', marginTop: SPACING.md },
  body: { fontSize: FONT_SIZE.base, lineHeight: 22, marginTop: SPACING.sm },
  actions: { flexDirection: 'row', gap: SPACING.base, paddingHorizontal: SPACING.base, marginTop: SPACING.base },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: SPACING.base, borderRadius: RADIUS.full },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: FONT_SIZE.base },
})
