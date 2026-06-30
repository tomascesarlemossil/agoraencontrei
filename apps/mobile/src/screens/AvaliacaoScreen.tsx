import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useApp } from '../context/AppContext'
import { Valuation } from '../services/api'
import { FONT_SIZE, RADIUS, SPACING } from '../utils/theme'
import { triggerHaptic, formatBRL } from '../utils/performance'

const TYPES = ['Casa', 'Apartamento', 'Terreno', 'Comercial']

export function AvaliacaoScreen() {
  const { colors } = useApp()
  const [step, setStep] = useState(0)
  const [data, setData] = useState({ city: '', neighborhood: '', type: 'Casa', bedrooms: '', area: '', name: '', cpf: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const set = (k: keyof typeof data) => (v: string) => setData((d) => ({ ...d, [k]: v }))

  const next = () => { triggerHaptic('light'); setStep((s) => Math.min(s + 1, 2)) }
  const back = () => { triggerHaptic('light'); setStep((s) => Math.max(s - 1, 0)) }

  const submit = async () => {
    setErr(null); setLoading(true)
    try {
      const res: any = await Valuation.create({
        city: data.city, neighborhood: data.neighborhood, type: data.type,
        bedrooms: Number(data.bedrooms) || undefined, area: Number(data.area) || undefined,
        name: data.name, cpf: data.cpf, email: data.email,
      })
      const value = res?.estimatedValue || res?.data?.estimatedValue || res?.value || res?.data?.value
      setResult(typeof value === 'number' ? value : Number(value) || 0)
      triggerHaptic('success')
    } catch (e: any) {
      setErr(e?.message || 'Não foi possível gerar a avaliação agora.'); triggerHaptic('error')
    } finally { setLoading(false) }
  }

  if (result !== null) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="ribbon" size={56} color={colors.gold} />
        <Text style={[styles.resLbl, { color: colors.textSecondary }]}>Valor estimado</Text>
        <Text style={[styles.resVal, { color: colors.navy }]}>{formatBRL(result)}</Text>
        <Text style={[styles.resHint, { color: colors.textSecondary }]}>
          Estimativa por 3 métodos (comparativo de mercado, renda capitalizada e custo de reposição).
        </Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        <View style={styles.steps}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.stepDot, { backgroundColor: i <= step ? colors.gold : colors.border }]} />
          ))}
        </View>

        {step === 0 && (
          <>
            <Text style={[styles.h, { color: colors.text }]}>Onde fica o imóvel?</Text>
            <Field label="Cidade" value={data.city} onChange={set('city')} colors={colors} />
            <Field label="Bairro" value={data.neighborhood} onChange={set('neighborhood')} colors={colors} />
          </>
        )}
        {step === 1 && (
          <>
            <Text style={[styles.h, { color: colors.text }]}>Características</Text>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Tipo</Text>
            <View style={styles.chips}>
              {TYPES.map((t) => (
                <Pressable key={t} accessibilityRole="button" onPress={() => { triggerHaptic('light'); set('type')(t) }}
                  style={[styles.chip, { borderColor: data.type === t ? colors.gold : colors.border, backgroundColor: data.type === t ? colors.gold : 'transparent' }]}>
                  <Text style={{ color: data.type === t ? colors.navy : colors.text, fontWeight: '700' }}>{t}</Text>
                </Pressable>
              ))}
            </View>
            <Field label="Quartos" value={data.bedrooms} onChange={set('bedrooms')} colors={colors} keyboardType="number-pad" />
            <Field label="Área (m²)" value={data.area} onChange={set('area')} colors={colors} keyboardType="number-pad" />
          </>
        )}
        {step === 2 && (
          <>
            <Text style={[styles.h, { color: colors.text }]}>Seus dados</Text>
            <Text style={[styles.gift, { color: colors.gold }]}>🎁 1ª avaliação gratuita por CPF</Text>
            <Field label="Nome" value={data.name} onChange={set('name')} colors={colors} autoCapitalize="words" />
            <Field label="CPF" value={data.cpf} onChange={set('cpf')} colors={colors} keyboardType="number-pad" />
            <Field label="E-mail" value={data.email} onChange={set('email')} colors={colors} keyboardType="email-address" autoCapitalize="none" />
          </>
        )}

        {!!err && <Text style={[styles.err, { color: colors.error }]}>{err}</Text>}

        <View style={styles.nav}>
          {step > 0 && (
            <Pressable accessibilityRole="button" onPress={back} style={[styles.btn, styles.ghost, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>Voltar</Text>
            </Pressable>
          )}
          {step < 2 ? (
            <Pressable accessibilityRole="button" onPress={next} style={[styles.btn, { backgroundColor: colors.navy }]}>
              <Text style={styles.btnTxt}>Continuar</Text>
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" onPress={submit} disabled={loading} style={[styles.btn, { backgroundColor: colors.gold, opacity: loading ? 0.7 : 1 }]}>
              {loading ? <ActivityIndicator color={colors.navy} /> : <Text style={[styles.btnTxt, { color: colors.navy }]}>Avaliar agora</Text>}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Field({ label, value, onChange, colors, ...rest }: any) {
  return (
    <View style={{ marginTop: SPACING.base }}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput value={value} onChangeText={onChange}
        style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]} {...rest} />
    </View>
  )
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: SPACING.md },
  stepDot: { width: 40, height: 6, borderRadius: 3 },
  h: { fontSize: FONT_SIZE.xl, fontWeight: '800', marginBottom: SPACING.sm },
  label: { fontSize: FONT_SIZE.sm, marginBottom: 4, marginTop: SPACING.sm },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.base, paddingVertical: 12, fontSize: FONT_SIZE.base },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: 4 },
  chip: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1.5 },
  gift: { fontSize: FONT_SIZE.sm, fontWeight: '700', marginBottom: SPACING.sm },
  err: { marginTop: SPACING.base, textAlign: 'center' },
  nav: { flexDirection: 'row', gap: SPACING.base, marginTop: SPACING.lg },
  btn: { flex: 1, paddingVertical: SPACING.base, borderRadius: RADIUS.full, alignItems: 'center' },
  ghost: { borderWidth: 1.5, flex: 0.5 },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: FONT_SIZE.base },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  resLbl: { fontSize: FONT_SIZE.base, marginTop: SPACING.base, textTransform: 'uppercase', letterSpacing: 1 },
  resVal: { fontSize: 40, fontWeight: '800', marginTop: 4 },
  resHint: { fontSize: FONT_SIZE.sm, textAlign: 'center', marginTop: SPACING.base, lineHeight: 20 },
})
