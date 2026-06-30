import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useApp } from '../context/AppContext'
import { Auth } from '../services/api'
import { FONT_SIZE, RADIUS, SPACING } from '../utils/theme'
import { triggerHaptic } from '../utils/performance'
import { Brand } from '../components/Brand'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>

export function AuthScreen({ route, navigation }: Props) {
  const { colors, signIn } = useApp()
  const [mode, setMode] = useState<'login' | 'register'>(route.params?.mode || 'login')
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    setErr(null)
    if (!form.email || !form.password || (mode === 'register' && !form.name)) {
      setErr('Preencha os campos obrigatórios.'); triggerHaptic('error'); return
    }
    setLoading(true)
    try {
      const res: any = mode === 'login'
        ? await Auth.login(form.email.trim(), form.password)
        : await Auth.register({ name: form.name.trim(), email: form.email.trim(), password: form.password, phone: form.phone.trim() || undefined })
      const token = res?.token || res?.accessToken || res?.data?.token
      const user = res?.user || res?.data?.user || { email: form.email.trim(), name: form.name.trim() }
      if (token) await signIn(token, user)
      triggerHaptic('success')
      navigation.goBack()
    } catch (e: any) {
      setErr(e?.message || 'Não foi possível continuar.'); triggerHaptic('error')
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, flexGrow: 1, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: SPACING.lg }}><Brand size={28} /></View>
        <Text style={[styles.h, { color: colors.text }]}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</Text>

        {mode === 'register' && (
          <Field label="Nome completo" value={form.name} onChange={set('name')} colors={colors} autoCapitalize="words" />
        )}
        <Field label="E-mail" value={form.email} onChange={set('email')} colors={colors} keyboardType="email-address" autoCapitalize="none" />
        <Field label="Senha" value={form.password} onChange={set('password')} colors={colors} secureTextEntry />
        {mode === 'register' && (
          <Field label="Telefone (opcional)" value={form.phone} onChange={set('phone')} colors={colors} keyboardType="phone-pad" />
        )}

        {!!err && <Text style={[styles.err, { color: colors.error }]}>{err}</Text>}

        <Pressable accessibilityRole="button" accessibilityLabel={mode === 'login' ? 'Entrar' : 'Cadastrar'}
          onPress={submit} disabled={loading}
          style={[styles.btn, { backgroundColor: colors.navy, opacity: loading ? 0.7 : 1 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>{mode === 'login' ? 'Entrar' : 'Cadastrar'}</Text>}
        </Pressable>

        <Pressable accessibilityRole="button" onPress={() => { triggerHaptic('light'); setMode(mode === 'login' ? 'register' : 'login'); setErr(null) }}>
          <Text style={[styles.switch, { color: colors.textSecondary }]}>
            {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
            <Text style={{ color: colors.gold, fontWeight: '700' }}>{mode === 'login' ? 'Cadastre-se' : 'Entrar'}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Field({ label, value, onChange, colors, ...rest }: any) {
  return (
    <View style={{ marginTop: SPACING.base }}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} placeholderTextColor={colors.midGray}
        style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]} {...rest} />
    </View>
  )
}

const styles = StyleSheet.create({
  h: { fontSize: FONT_SIZE.xl, fontWeight: '800', textAlign: 'center', marginBottom: SPACING.sm },
  label: { fontSize: FONT_SIZE.sm, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.base, paddingVertical: 12, fontSize: FONT_SIZE.base },
  err: { marginTop: SPACING.base, textAlign: 'center' },
  btn: { marginTop: SPACING.lg, paddingVertical: SPACING.base, borderRadius: RADIUS.full, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: FONT_SIZE.base },
  switch: { textAlign: 'center', marginTop: SPACING.base, fontSize: FONT_SIZE.sm },
})
